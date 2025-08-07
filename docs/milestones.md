


# Program Milestones and Payment Exhibit ($5k)

## Project Details

- **Lead Applicant Name:** Stefano Lombardo
- **Project Name:** Futura
- **Project Description:** Futura is a digital heritage platform to preserve and share memories.
- **Proposed Start Date:** 15.06.25
- **Project Duration:** 1-3 months

## Grant Structure

For your $5,000 grant, you will have a total of two (2) check-ins with the Grants Committee:

- First milestone: Mid-point check-in ($2,500 Reward)
- Final milestone: End of the grant ($2,500 Reward)

## Milestones

### First Milestone (Mid-point)

**Goal:** Build and deploy a landing page using Next.js on Juno with dynamic segmentation to address different yet near market segments and validate hypotheses through A/B testing and Fake Door Testing methodologies.

#### Objectives and Specific Commits:

Tasks:

Develop a dynamic **landing page** which goal is to validate interest in the project and identify a target user group. The page will support three distinct user segments (Family, Wedding, Transcendence):

- Display personalized hero sections, "Learn More" content, and CTAs tailored to each visitor segment (Family, Wedding, Transcendence).
- Implement lightweight backend to collect user emails via Juno serverless (no memories storage).

1. Social Family Memories Vault (/family)

Description: A digital vault to store memories (long-term, cross generational), pass them down to descendants, and share with the most beloved people. *Preserve memories across generations*

Features:
- Front-end onboarding system to test user interest in uploading and sharing memories (Fake Door: user thinks they are stored but they are not)
- Mailgun integration for memory sharing notifications

2. Wedding Memories Vault (/wedding)

Description: A digital vault or time capsule for newlyweds to collect and preserve their most precious wedding memories, allowing friends and family to contribute to their journey. Possibly targeting the wedding gift vertical, so not the users themselves. *Offer the unforgetable*

3. Transcendence (/transcendence)
Description: An AI-powered digital self, reconstructed from personal memories and hosted on-chain, enabling future generations to engage with the preserved personality of a loved one. *Talk with your great, great grandpa*

Deliverables:

- Fully deployed landing page using Next.js on Juno
- Three distinct user journeys (/family, /wedding, /transcendence) with customized:
- Basic data storage use for email capture



**Reward after 1st Milestone:** $2,500

### Final Milestone

**Goal:** Wire up conversion tracking using Juno Analytics and (if needed) PostHog, and create and launch targeted ad campaigns to test conversion rates across different verticals. Collect, display, and evaluate data to validate core market hypotheses.

#### Objectives and Specific Commits:

1. Integrate Juno Analytics and (if insuficient) PostHog.

- Set up event tracking on the segmented landing pages (/family, /wedding, /transcendence) to log key user actions like CTA clicks, email submissions, and shares

2. Start ad campaigns.

- Create campaign content tailored to the three landing page segments (/family, /wedding, /transcendence), including:
- Visuals (static or short-form)
- Copy adapted to each use case
- Evaluate and select from available ad platforms (Facebook, Instagram, Google Ads, Reddit, Twitter) based on audience fit, targeting options, and expected cost.
- Set up and launch the campaign on the chosen platform(s).
- Track reach and click-through metrics using the platform's built-in dashboard.

3. Evaluate metrics and create detailed report

Deliverables:

- Complete Juno Analytics integration with custom event tracking
- Basic data storage use for email capture
- Technical debt assessment and improvement opportunities
- Analysis of the Campaign


**Reward after Final Demo:** $2,500

## Total Maximum Reward: $5,000

---

_Note: I acknowledge and understand that most distributions are sent 2-3 weeks after a milestone is completed._

_Today's date: [DATE]_

[^wedding-note]: While the core product remains the same, this vertical targets a more precise niche with distinct advantages: weddings are highly emotional events where people are naturally inclined to spend on meaningful gifts, the target audience is younger and more tech-savvy, and the audience is more easily reachable through specific wedding-related channels and communities.
