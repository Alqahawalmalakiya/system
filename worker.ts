import handler from 'vinext/server/fetch-handler';

export default {
  async fetch(
    request: Request,
    env: Cloudflare.Env,
    ctx: ExecutionContext
  ) {
    const headers = new Headers(request.headers);
    headers.set('x-royal-user-email', 'operator@local.invalid');

    const response = await handler.fetch(
      new Request(request, { headers }),
      env,
      ctx
    );

    const result = new Response(response.body, response);
    result.headers.set('Cache-Control', 'private, no-store');
    return result;
  }
};
