import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { glob } from 'glob';

// Load environment variables
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error('Error: Missing required environment variables.');
  console.error('Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in your .env file.');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function deploy() {
  try {
    console.log(`🚀 Starting deployment to ${GITHUB_OWNER}/${GITHUB_REPO} on branch ${GITHUB_BRANCH}...`);

    // 1. Get the latest commit SHA
    let latestCommitSha: string | null = null;
    let baseTreeSha: string | undefined = undefined;
    
    try {
      const { data: refData } = await octokit.git.getRef({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        ref: `heads/${GITHUB_BRANCH}`,
      });
      latestCommitSha = refData.object.sha;
      console.log(`✅ Found latest commit: ${latestCommitSha.substring(0, 7)}`);
      
      // 2. Get the base tree SHA
      const { data: commitData } = await octokit.git.getCommit({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        commit_sha: latestCommitSha,
      });
      baseTreeSha = commitData.tree.sha;
      console.log(`✅ Found base tree: ${baseTreeSha.substring(0, 7)}`);
    } catch (e: any) {
      if (e.status === 404 || e.status === 409) { // 409 Conflict is returned for empty repos sometimes
        console.log(`⚠️ Branch ${GITHUB_BRANCH} not found or repository is empty. Will create initial commit.`);
      } else {
        throw e;
      }
    }

    // 3. Read all files
    const files = await glob('**/*', {
      ignore: ['node_modules/**', '.git/**', 'dist/**', '.env', '.DS_Store'],
      nodir: true,
      dot: true,
    });
    console.log(`📂 Found ${files.length} files to sync.`);

    // 3.5. Identify files to delete (exist on GitHub but not locally)
    const treeItems: { path: string; mode: '100644' | '100755' | '040000' | '160000' | '120000'; type: 'blob' | 'tree' | 'commit'; sha?: string | null }[] = [];
    
    if (baseTreeSha) {
      try {
        const { data: remoteTree } = await octokit.git.getTree({
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
          tree_sha: baseTreeSha,
          recursive: 'true',
        });
        
        // Normalize local file paths for comparison
        const localFilesSet = new Set(files.map(f => f.replace(/\\/g, '/')));
        
        for (const item of remoteTree.tree) {
          if (item.type === 'blob' && item.path && !localFilesSet.has(item.path)) {
            // File exists on GitHub but not locally -> delete it
            treeItems.push({
              path: item.path,
              mode: '100644',
              type: 'blob',
              sha: null, // Setting sha to null deletes the file
            });
            console.log(`🗑️  Marked for deletion: ${item.path}`);
          }
        }
      } catch (e) {
        console.warn(`⚠️ Could not fetch remote tree for deletion check:`, e);
      }
    }

    // 4. Create blobs for each file

    for (const file of files) {
      const content = fs.readFileSync(file);
      // Check if binary
      const isBinary = isBinaryFile(file, content);
      const encoding = isBinary ? 'base64' : 'utf-8';
      const contentStr = isBinary ? content.toString('base64') : content.toString('utf-8');

      const { data: blobData } = await octokit.git.createBlob({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        content: contentStr,
        encoding: encoding,
      });

      treeItems.push({
        path: file,
        mode: '100644', // TODO: Handle executables if needed
        type: 'blob',
        sha: blobData.sha,
      });
      
      process.stdout.write('.'); // Progress indicator
    }
    console.log('\n✅ Blobs created.');

    // 5. Create a new tree
    const treeParams: any = {
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      tree: treeItems,
    };
    if (baseTreeSha) {
      treeParams.base_tree = baseTreeSha;
    }
    
    const { data: treeData } = await octokit.git.createTree(treeParams);
    console.log(`✅ Created new tree: ${treeData.sha.substring(0, 7)}`);

    // 6. Create a commit
    const commitParams: any = {
      owner: GITHUB_OWNER!,
      repo: GITHUB_REPO!,
      message: `Deploy: Sync from AI Studio at ${new Date().toISOString()}`,
      tree: treeData.sha,
    };
    if (latestCommitSha) {
      commitParams.parents = [latestCommitSha];
    }
    
    const { data: newCommitData } = await octokit.git.createCommit(commitParams);
    console.log(`✅ Created commit: ${newCommitData.sha.substring(0, 7)}`);

    // 7. Update the reference or create it if it doesn't exist
    if (latestCommitSha) {
      await octokit.git.updateRef({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        ref: `heads/${GITHUB_BRANCH}`,
        sha: newCommitData.sha,
      });
      console.log(`✅ Updated branch ${GITHUB_BRANCH}`);
    } else {
      await octokit.git.createRef({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        ref: `refs/heads/${GITHUB_BRANCH}`,
        sha: newCommitData.sha,
      });
      console.log(`✅ Created branch ${GITHUB_BRANCH}`);
    }

    console.log(`🎉 Successfully deployed to https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/tree/${GITHUB_BRANCH}`);

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

function isBinaryFile(filePath: string, buffer: Buffer): boolean {
  // Simple check: extension or null bytes
  const ext = path.extname(filePath).toLowerCase();
  const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.woff', '.woff2', '.ttf', '.eot'];
  if (binaryExts.includes(ext)) return true;

  // Check for null bytes in first 1000 bytes
  for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

deploy();
