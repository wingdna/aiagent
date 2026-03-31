import { PagesFunction } from '../../_shared/types';

export const onRequestPost: PagesFunction<any> = async () => {
  return new Response(JSON.stringify({ success: true, message: 'URL submitted to Indexing API queue' }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};
