const fs = require('fs');
const path = require('path');

const sections = ['blog', 'showcase', 'team', 'careers', 'docs', 'guides'];
const srcDir = path.join(__dirname, 'src');

sections.forEach(section => {
  // Create content directory
  const contentDir = path.join(srcDir, 'content', section);
  fs.mkdirSync(contentDir, { recursive: true });
  
  // Create placeholder markdown
  const mdContent = `---
title: 'Welcome to ${section}'
description: 'This is a placeholder for the ${section} section.'
date: '2026-04-17'
---

## Welcome to ${section}

This is a placeholder entry. You can fill this with your own content.
`;
  fs.writeFileSync(path.join(contentDir, 'placeholder.md'), mdContent);

  // Create pages directory
  const pagesDir = path.join(srcDir, 'pages', section);
  fs.mkdirSync(pagesDir, { recursive: true });

  // Create index.astro
  const indexAstro = `---
import { getCollection, render } from 'astro:content';
import FormattedDate from '../../components/FormattedDate.astro';
import Layout from '../../layouts/IndexLayout.astro';

const posts = await getCollection('${section}');
posts.sort((a, b) => +b.data.date - +a.data.date);
---

<Layout title="${section.charAt(0).toUpperCase() + section.slice(1)}">
	<main>
		<h1 class="page_title">${section.charAt(0).toUpperCase() + section.slice(1)}</h1>
		<hr />
		<ul class="posts" transition:name="post">
			{
				posts.map((post) => (
					<li class="post">
						<div class="version_wrapper">
							<div class="version_info">
								<a href={\`/${section}/\${post.id}\`}>
									<FormattedDate class="date" date={post.data.date} />
								</a>
							</div>
						</div>
						<div class="content">
							<a href={\`/${section}/\${post.id}\`}><h2>{post.data.title}</h2></a>
							<p>{post.data.description}</p>
						</div>
					</li>
				))
			}
		</ul>
	</main>
</Layout>
`;
  fs.writeFileSync(path.join(pagesDir, 'index.astro'), indexAstro);

  // Create [slug].astro
  const slugAstro = `---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
	const posts = await getCollection('${section}');
	return posts.map((post) => ({
		params: { slug: post.id },
		props: { post },
	}));
}

const { post } = Astro.props;
const { Content } = await render(post);

// Mock release object to satisfy PostLayout props
const release = {
  data: {
    title: post.data.title,
    description: post.data.description,
    date: post.data.date,
    versionNumber: '',
    image: { src: '', alt: '' }
  }
};
---

<Layout release={release}>
	<Content />
</Layout>
`;
  fs.writeFileSync(path.join(pagesDir, '[slug].astro'), slugAstro);
});

console.log('Created 6 new sections: ' + sections.join(', '));
