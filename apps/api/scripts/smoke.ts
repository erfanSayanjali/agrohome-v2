import "dotenv/config";

const base = process.env.SMOKE_API_BASE || "http://127.0.0.1:3002";

async function json(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const health = await json(await fetch(`${base}/health`));
  console.log("health", health);

  const phone = process.env.ADMIN_PHONE || "09120000000";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const login = await json(
    await fetch(`${base}/api/v1/auth/login-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    })
  );
  console.log("login ok", login.content?.user?.phone);

  const cookie = (login as { content?: unknown }) && "";
  // cookie jar: re-login capturing set-cookie
  const loginRes = await fetch(`${base}/api/v1/auth/login-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  const setCookie = loginRes.headers.getSetCookie?.() || [];
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
  await json(loginRes);
  void cookie;

  const productRes = await fetch(`${base}/api/v1/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: "Smoke Product",
      slug: `smoke-product-${Date.now()}`,
      status: "AVAILABLE",
    }),
  });
  const product = await json(productRes);
  console.log("product created", product.content?.id);

  const pageRes = await fetch(`${base}/api/v1/admin/pages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: "Home",
      slug: "/",
      status: "draft",
    }),
  });
  const pageBody = await pageRes.json();
  let pageId = pageBody.content?.id as string | undefined;
  if (!pageRes.ok) {
    // maybe exists — list and find
    const list = await json(
      await fetch(`${base}/api/v1/admin/pages`, { headers: { Cookie: cookieHeader } })
    );
    pageId = (list.content as Array<{ id: string; slug: string }>).find(
      (p) => p.slug === "/"
    )?.id;
  }
  if (!pageId) throw new Error("page id missing");

  await json(
    await fetch(`${base}/api/v1/admin/blocks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        ownerType: "PAGE",
        pageId,
        type: "hero",
        sourceType: "STATIC",
        payload: { title: "Smoke Hero" },
        sortOrder: 0,
      }),
    })
  );

  const publicPage = await json(await fetch(`${base}/api/v1/pages/%2F`));
  console.log("public page snapshot blocks", publicPage.content?.snapshot?.blocks?.length);

  const filterOverride = await fetch(
    `${base}/api/v1/products?filters=${encodeURIComponent(JSON.stringify({ status: "UNAVAILABLE" }))}`
  );
  const filterBody = await filterOverride.json();
  const statuses = (filterBody.content as Array<{ status?: string }> | undefined)?.map(
    (item) => item.status
  );
  if (statuses?.some((status) => status !== "AVAILABLE")) {
    throw new Error("public product filter override still exposes non-AVAILABLE items");
  }
  console.log("filter override guard ok");

  const checkPhone = await json(
    await fetch(`${base}/api/v1/auth/check-phone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })
  );
  if ("exists" in checkPhone.content) {
    throw new Error("check-phone still exposes user enumeration");
  }
  console.log("check-phone enumeration guard ok");

  console.log("SMOKE OK");
}

main().catch((err) => {
  console.error("SMOKE FAILED", err);
  process.exit(1);
});
