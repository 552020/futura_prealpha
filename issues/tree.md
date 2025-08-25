.
├── .vscode
│   └── settings.json
├── docs
├── issues
│   └── implement-folder-upload.md
├── public
│   ├── hero
│   ├── images
│   │   └── segments
│   │       ├── black-mirror
│   │       └── family
│   └── logo
├── src
│   ├── app
│   │   ├── [lang]
│   │   │   ├── [segment]
│   │   │   │   ├── actions.ts
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── about
│   │   │   │   └── page.tsx
│   │   │   ├── dictionaries
│   │   │   │   ├── about
│   │   │   │   │   ├── de.json
│   │   │   │   │   └── en.json
│   │   │   │   ├── base
│   │   │   │   │   ├── de.json
│   │   │   │   │   ├── en.json
│   │   │   │   │   ├── es.json
│   │   │   │   │   ├── fr.json
│   │   │   │   │   ├── it.json
│   │   │   │   │   ├── pl.json
│   │   │   │   │   ├── pt.json
│   │   │   │   │   └── zh.json
│   │   │   │   ├── faq
│   │   │   │   │   ├── de.json
│   │   │   │   │   └── en.json
│   │   │   │   ├── onboarding
│   │   │   │   │   ├── de.json
│   │   │   │   │   └── en.json
│   │   │   │   └── segments
│   │   │   │       ├── black-mirror
│   │   │   │       │   ├── black-mirror.md
│   │   │   │       │   ├── de.json
│   │   │   │       │   └── en.json
│   │   │   │       └── family
│   │   │   │           ├── de.json
│   │   │   │           ├── en.json
│   │   │   │           └── family.md
│   │   │   ├── faq
│   │   │   │   └── page.tsx
│   │   │   ├── onboarding
│   │   │   │   ├── items-upload
│   │   │   │   │   ├── items-upload-client.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── profile
│   │   │   │       └── page.tsx
│   │   │   ├── shared
│   │   │   │   ├── [id]
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── user
│   │   │   │   ├── [id]
│   │   │   │   │   └── profile
│   │   │   │   │       └── page.tsx
│   │   │   │   └── profile
│   │   │   │       └── page.tsx
│   │   │   ├── vault
│   │   │   │   ├── [id]
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   ├── not-found.tsx
│   │   │   └── page.tsx
│   │   ├── api
│   │   │   ├── auth
│   │   │   │   └── [...nextauth]
│   │   │   │       ├── auth.ts
│   │   │   │       └── route.ts
│   │   │   ├── memories
│   │   │   │   ├── [id]
│   │   │   │   │   ├── download
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── share
│   │   │   │   │   │   ├── route.md
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── share-link
│   │   │   │   │   │   ├── code
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── shared
│   │   │   │   │   └── route.ts
│   │   │   │   ├── upload
│   │   │   │   │   ├── onboarding
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── utils.ts
│   │   │   │   ├── utils
│   │   │   │   │   ├── access.ts
│   │   │   │   │   ├── email.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── memory.ts
│   │   │   │   ├── route.ts
│   │   │   │   └── utils.ts
│   │   │   ├── tests
│   │   │   │   └── mailgun
│   │   │   │       └── route.ts
│   │   │   ├── users
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── utils.ts
│   │   ├── onboarding
│   │   ├── tests
│   │   │   ├── files
│   │   │   │   ├── [id]
│   │   │   │   │   ├── file-detail-editor.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── upload
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── mailgun
│   │   │   │   └── page.tsx
│   │   │   ├── posthog
│   │   │   │   └── page.tsx
│   │   │   ├── tailwind
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── user
│   │   └── favicon.ico
│   ├── components
│   │   ├── legacy
│   │   │   └── hero.tsx
│   │   ├── memory
│   │   │   ├── ItemUploadButton.tsx
│   │   │   ├── MemoryActions.tsx
│   │   │   ├── MemoryCard.tsx
│   │   │   ├── MemoryGrid.tsx
│   │   │   ├── MemoryStatus.tsx
│   │   │   └── ShareDialog.tsx
│   │   ├── onboarding
│   │   │   ├── common
│   │   │   │   ├── image-preview.tsx
│   │   │   │   ├── step-container.tsx
│   │   │   │   └── step-navigation.tsx
│   │   │   ├── hooks
│   │   │   │   └── use-step-navigation.ts
│   │   │   ├── steps
│   │   │   │   ├── share-step.tsx
│   │   │   │   ├── sign-up-step.tsx
│   │   │   │   └── user-info-step.tsx
│   │   │   └── onboard-modal.tsx
│   │   ├── ui
│   │   │   ├── accordion.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── tooltip.tsx
│   │   ├── utils
│   │   │   └── translation-validation.ts
│   │   ├── access-denied.tsx
│   │   ├── auth-components.tsx
│   │   ├── bottom-nav.tsx
│   │   ├── default-home.tsx
│   │   ├── footer.tsx
│   │   ├── header.tsx
│   │   ├── hero-demo.tsx
│   │   ├── hero.tsx
│   │   ├── language-switcher.tsx
│   │   ├── memory-viewer.tsx
│   │   ├── mode-toggle.tsx
│   │   ├── nav-bar.tsx
│   │   ├── posthog-provider.tsx
│   │   ├── profile.tsx
│   │   ├── sidebar.tsx
│   │   ├── theme-provider.tsx
│   │   ├── user-button-client.tsx
│   │   ├── user-button.tsx
│   │   └── value-journey.tsx
│   ├── contexts
│   │   ├── interface-context.tsx
│   │   └── onboarding-context.tsx
│   ├── db
│   │   ├── fixtures
│   │   │   ├── assets
│   │   │   │   └── tenenbaum
│   │   │   │       ├── chas.jpeg
│   │   │   │       ├── margot_richard_tent.mp4
│   │   │   │       ├── old_custer_NYRB.md
│   │   │   │       ├── old_custer_quarterly.md
│   │   │   │       ├── richard.jpeg
│   │   │   │       ├── royal-tenenbaums-2000.pdf
│   │   │   │       ├── the_year_of_secret_umbrellas.docx
│   │   │   │       ├── the_year_of_secret_umbrellas.epub
│   │   │   │       ├── the_year_of_secret_umbrellas.md
│   │   │   │       ├── the_year_of_secret_umbrellas.odt
│   │   │   │       ├── the_year_of_secret_umbrellas.pdf
│   │   │   │       └── the_year_of_secret_umbrellas.rtf
│   │   │   ├── tenenbaum
│   │   │   │   ├── chas.json
│   │   │   │   ├── eli.json
│   │   │   │   ├── index.ts
│   │   │   │   ├── margot.json
│   │   │   │   ├── richie.json
│   │   │   │   ├── seedTenenbaum.ts
│   │   │   │   └── wes.json
│   │   │   └── tenenbaum.md
│   │   ├── create-test-users.ts
│   │   ├── db.ts
│   │   ├── familyTrees.ts
│   │   ├── schema.example.ts.md
│   │   ├── schema.ts
│   │   └── seed.ts
│   ├── hooks
│   │   ├── use-toast.ts
│   │   └── user-file-upload.ts
│   ├── lib
│   │   ├── blob.ts
│   │   └── utils.ts
│   ├── types
│   │   └── memory.ts
│   ├── utils
│   │   ├── authentication.ts
│   │   ├── dictionaries.ts
│   │   ├── mailgun.ts
│   │   ├── memories.ts
│   │   ├── navigation.ts
│   │   └── normalizeMemories.ts
│   ├── middleware.md
│   └── middleware.ts
├── .gitignore
├── .gitmodules
├── README.md
├── auth.md
├── auth.ts
├── components.json
├── drizzle.config.ts
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── posthog.ts
├── tree.md
├── tsconfig.json
└── vercel.json

81 directories, 184 files
