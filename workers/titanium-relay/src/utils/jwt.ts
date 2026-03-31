export async function signJWT(payload: any, secret: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${dataToSign}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const dataToSign = `${encodedHeader}.${encodedPayload}`;

        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signatureStr = atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'));
        const signature = new Uint8Array(signatureStr.length);
        for (let i = 0; i < signatureStr.length; i++) {
            signature[i] = signatureStr.charCodeAt(i);
        }

        const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(dataToSign));
        if (!isValid) return null;

        const payloadStr = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(payloadStr);
    } catch (e) {
        return null;
    }
}
