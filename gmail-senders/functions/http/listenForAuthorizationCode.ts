export default async function listenForAuthorizationCode(
  state: string,
): Promise<string> {
  let code = "";
  outer:
  for await (const conn of Deno.listen({ port: 3000 })) {
    for await (const e of Deno.serveHttp(conn)) {
      const params = new URL(e.request.url).searchParams;
      const error = params.get("error");
      const returnedState = params.get("state");
      if (!params.toString()) {
        await e.respondWith(
          new Response(
            "You're all done authorizing the app, and may close this tab.",
          ),
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        break outer;
      } else if (returnedState !== state) {
        await e.respondWith(
          new Response(
            `OAuth State Mismatch, Expected ${state}, got ${returnedState}`,
            { status: 400 },
          ),
        );
      } else {
        code = params.get("code") ?? "";
        if (code) {
          await e.respondWith(Response.redirect("http://localhost:3000"));
        } else if (error) {
          await e.respondWith(
            new Response(
              `There was an error during authorization -- ${error}`,
              { status: 400 },
            ),
          );
        } else {
          await e.respondWith(new Response("Not Found", { status: 404 }));
        }
      }
    }
  }
  return code;
}
