/**
 * Validates if the incoming redirect URI matches the client's registered redirect URI,
 * with special exceptions for demo/todo client apps.
 */
export function isValidRedirectUri(params: {
    clientId: string;
    incomingRedirectUri: string;
    dbRedirectUri: string;
    host: string;
}): boolean {
    const { clientId, incomingRedirectUri, dbRedirectUri, host } = params;

    // 1. Standard exact match check
    if (dbRedirectUri === incomingRedirectUri) {
        return true;
    }

    // 2. Exception case for the demo client
    if (clientId === 'demo-client-id') {
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const expectedDemoRedirectUri = `${protocol}://${host}/demo-client/callback`;
        return incomingRedirectUri === expectedDemoRedirectUri;
    }

    // 3. Exception case for the todo client
    if (clientId === 'todo-client-id') {
        try {
            const url = new URL(incomingRedirectUri);
            const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
            const isRender = url.hostname.endsWith('.onrender.com');
            const isCorrectPath = url.pathname === '/api/auth/callback';
            
            return (isLocalhost || isRender) && isCorrectPath;
        } catch (e) {
            return false; // Invalid URL structure
        }
    }

    return false;
}
