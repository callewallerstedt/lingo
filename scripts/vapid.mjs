#!/usr/bin/env node
/**
 * Generates a VAPID key pair for web push.
 * Run once, then paste the output into .env.local and your Vercel env vars.
 */
import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log("\nAdd these to .env.local and to your Vercel project settings:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log(`VAPID_SUBJECT=mailto:you@example.com\n`);
console.log("Keep VAPID_PRIVATE_KEY secret. Rotating it invalidates every existing subscription.\n");
