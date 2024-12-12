"use server";

import { headers as getHeaders, cookies as getCookies } from "next/headers";
import { redirect } from "next/navigation";
import { client, subjects, setTokens } from "./auth";

export async function auth() {
  const cookies = await getCookies();
  const accessToken = cookies.get("access_token");
  const refreshToken = cookies.get("refresh_token");
  console.log(accessToken, refreshToken);

  if (!accessToken) {
    return false;
  }

  const verified = await client.verify(subjects, accessToken.value, {
    refresh: refreshToken?.value,
  });

  if (verified.err) {
    return false;
  }
  if (verified.tokens) {
    await setTokens(verified.tokens.access, verified.tokens.refresh);
  }

  return verified.subject;
}

export async function login() {
  const cookies = await getCookies();
  const accessToken = cookies.get("access_token");
  const refreshToken = cookies.get("refresh_token");

  if (accessToken) {
    const verified = await client.verify(subjects, accessToken.value, {
      refresh: refreshToken?.value,
    });
    if (!verified.err && verified.tokens) {
      await setTokens(verified.tokens.access, verified.tokens.refresh);
      redirect("/");
    }
  }

  const headers = await getHeaders();
  const host = headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const redirectUrl = client.authorize(
    `${protocol}://${host}/api/callback`,
    "code",
  );
  redirect(redirectUrl);
}

export async function logout() {
  const cookies = await getCookies();
  cookies.delete("access_token");
  cookies.delete("refresh_token");
  redirect("/");
}