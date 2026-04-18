---
title: 'Interactive Components'
description: 'Using disclosure elements and other interactive features in Markdown.'
date: '2026-04-18'
---

# Interaction & Feedback

Standard Markdown can be extended with native HTML elements to provide better user experiences.

## Disclosure Elements

Use `<details>` and `<summary>` for frequently asked questions or to hide spoilers and technical details.

<details>
<summary>Click to reveal the Archive Password</summary>
The password is <code>ROT_KEEPER_2026</code>. Please keep it confidential.
</details>

## Horizontal Rules

Use three or more dashes `---` to create a visual break in your content.

---

## Tooltips & Hover Effects

While we don't have a specific tooltip component, standard links and buttons have built-in hover states that match the theme's teal and amber palette.

[Hover over this link](/) to see the transition.

## Alpine.js Integration

Since this theme includes Alpine.js, you can even include simple interactive logic directly in your guides (if your renderer allows it).

<div x-data="{ count: 0 }" class="p-4 border border-gray-200 dark:border-gray-800 rounded-xl my-4">
    <p>Archive Access Count: <span x-text="count" class="font-bold text-teal-500"></span></p>
    <button @click="count++" class="btn btn-secondary mt-2">Increment Access Log</button>
</div>

*Note: The above block uses Alpine.js for interactivity.*
