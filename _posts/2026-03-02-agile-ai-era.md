---
layout: post
title: "Agile in the AI Era: The Framework That Solved Yesterday's Problems"
date: 2026-03-02 22:00:00 +0100
categories: ai tech engineering
---

As some of you knows, I believe in Agility in software development. I've exercised for at least one and a half year as Scrum Master in two companies, and I have PSM I certification. 

In my [last post]({{ "/ai/tech/engineering/2026/02/17/engineering-2026.html" | relative_url }}) I talked about what engineering looks like in 2026. How agents are writing the code, how engineers are becoming the ones who own the outcome, and how the relationship between human and machine is shifting faster than most of us expected. But since then, a different conversation keeps coming up in our team. Not about the tools. About the process.

AI is killing the Scrum framework. That is a reality. And every sprint that ends the same question floats to the surface of my brain: **does this still make sense?**

I don't think Agile is dead, but Scrum with AI is aging badly. I think the problems it was designed to solve are dissolving. And when the problems change, the framework has to change with them — or it becomes ritual without purpose. So let me walk through starting from the beginning.

## Why Agile Was Born

To understand where we're going, you have to understand where we came from.

Before 2001, the dominant model for software development was waterfall. You gathered all the requirements upfront, wrote a massive specification document, handed it to the developers, waited months (even years, thinking in big enterprise-grade applications), and then discovered that what you built didn't match what the business actually needed. By the time you had working software, the world had moved on.

Fred Brooks called out the core dysfunction as early as 1975 in **"The Mythical Man-Month"**. His famous law — *"Adding manpower to a late software project makes it later"* — exposed a truth that the industry kept ignoring: large teams don't move faster. They create coordination drag. Every new person added to a project increases the number of communication channels exponentially. Ten developers don't produce ten times the output of one — they produce maybe three times the output and seven times the meetings.

But the problems went deeper than team size:

- **Requirements were volatile.** By the time you finished building what was specified, the business had changed direction twice.
- **Waterfall delayed feedback too long.** Months of work before anyone saw working software meant months of assumptions going unvalidated.
- **Change was expensive.** Re-specifying, re-designing, re-coding — every pivot felt like starting over.
- **Communication latency was high.** The more people involved, the more handoffs, the more information got lost or distorted along the way.
- **Testing cycles were slow.** You built everything first, tested everything later, and prayed the integration worked.
- **Documentation was treated as a knowledge proxy.** We wrote things down not because documents were the best way to transfer knowledge, but because we couldn't talk to everyone often enough.

In February 2001, seventeen software practitioners met at a ski lodge in Snowbird, Utah, and wrote the [Agile Manifesto](https://agilemanifesto.org/). I wasn't in that room. But I've lived through enough waterfall SAP projects to understand why they needed to write it. They were tired of building the wrong thing, too slowly, with too many people, and finding out too late.

What came out of Snowbird was a set of values, not a methodology. *Individuals and interactions over processes and tools. Working software over comprehensive documentation. Customer collaboration over contract negotiation. Responding to change over following a plan.* Simple. Powerful. And wildly misunderstood over the next two decades.

Scrum became the most popular implementation. Jeff Sutherland's **"Scrum: The Art of Doing Twice the Work in Half the Time"** laid out the framework: cross-functional teams of five to nine people, two-week sprints, daily standups, sprint reviews, retrospectives. It worked. Not perfectly, not everywhere, but dramatically better than what came before. Robert C. Martin — Uncle Bob, one of the original Manifesto signers — later wrote **"Clean Agile: Back to Basics"** to remind everyone that Agile was always about technical discipline and short feedback loops, not about sticky notes on a wall.

And for twenty years, this was the standard. Until now.

## The Assumptions Behind the Framework

Before jumping into what's changing, let me make something explicit. Scrum wasn't built on abstract theory — it was built on a set of practical assumptions about how software teams work. And those assumptions made perfect sense in late 90s and early 00s. They're starting to crack in 2026.

**Assumption 1: You need enough people to cover the sprint backlog.** A single developer can only work on one thing at a time, so you need five to nine people to deliver a meaningful increment in two weeks.

**Assumption 2: Only humans can understand and explain the codebase.** Standups exist so the team knows who's working on what. Pairing exists so knowledge doesn't get siloed. Documentation exists because no one can hold the whole system in their head. Every Scrum ceremony around communication assumes that context lives exclusively in people — and if those people leave or get busy, the context is lost.

**Assumption 3: Team velocity is roughly predictable and scales with team size** — up to a point, bounded by [Brooks's Law](https://en.wikipedia.org/wiki/Brooks%27s_law).

**Assumption 4: The ideal engineer is T-shaped.** David Guest coined the concept back in 1991 — deep expertise in one area, broad enough to collaborate across disciplines. Tim Brown at IDEO later popularized it for design teams. In Scrum, T-shaped skills meant a backend developer who could review a frontend PR, or a tester who could write basic automation.

Here's the thing: **every one of these assumptions is being disrupted right now.**

## How AI Is Changing Everything

### Team Size: From 5-9 to 3-4

The classic Scrum guide prescribes teams of five to nine people. That number exists because of how much work a group of humans can coordinate and deliver in a two-week cycle. With AI-augmented engineers, the math changes fundamentally.

The numbers vary depending on who you ask, but the direction is unmistakable: one AI-augmented developer can produce the output that used to require five or more traditional coders. [Y Combinator data from 2025](https://www.cnbc.com/2025/03/15/y-combinator-startups-are-fastest-growing-in-fund-history-because-of-ai.html) shows that engineering team requirements at early-stage startups have collapsed — for about a quarter of current YC startups, 95% of their code is AI-generated, and founders no longer need massive engineering teams. Sam Altman has predicted multiple "one-person unicorns" — billion-dollar companies built by a single founder with AI. We're not there yet, but when the CEO of OpenAI says it's coming, you pay attention.

And it doesn't stop at single-task speed. With tools like git worktrees and AI subagents, a single engineer can now run one to three parallel tasks of certain complexity at the same time — each agent working in its own isolated branch while the engineer orchestrates, reviews, and merges. That's not theoretical. That's how I work sometimes today. What used to require three developers working on three separate stories now happens on one screen with one person directing traffic.

Here's what this means in practice. If you have engineers following the T-shaped concept — and with AI, the horizontal bar of that T stretches much wider — you don't need five specialists covering different parts of the stack. You need one strong engineer per product area, maybe two. A team of three to four people can move as fast as a team of eight used to, sometimes faster, because they skip the coordination tax entirely.

In my case, as a CAP developer focused mostly on backend services, I'm feeling comfortable enough to analyze and plan frontend tasks — layouts, component structure, user flows — because AI bridges the gap between what I know deeply and what I used to need a specialist for. The T gets wider not because you suddenly learned everything, but because you have an always-available expert sitting next to you.

The stats back this up: **84% of developers were using AI coding tools by late 2025**, and **63% were using code generation assistants like GitHub Copilot** daily. This isn't early adoption anymore. It's the baseline.

Let me be direct about something this implies, because I think the excitement around smaller teams can gloss over it: when teams go from five-to-nine to three-to-four, real people lose their positions. That's not an abstraction. [Around 123,000 tech employees were laid off in 2025](https://www.salesforceben.com/how-bad-were-tech-layoffs-in-2025-and-what-can-we-expect-next-year/), and software engineers ranked as the number one most-cut role during AI-driven restructuring. It's someone updating their LinkedIn, wondering whether their skills still matter, worrying about their mortgage. I don't think the answer is to pretend it's not happening or to slow down adoption to protect headcount. But I do think we owe each other honesty about the transition. The roles don't disappear entirely — they evolve. The QA engineer who used to write manual test cases becomes the person who designs AI testing strategies. The junior developer who wrote boilerplate becomes the one who reviews and validates AI output. But not everyone will make that transition, and the ones who struggle deserve support, not platitudes about "upskilling." This is the hardest part of the shift, and I don't have a clean answer for it.

And here's the irony: smaller teams were always better. Brooks knew it in 1975. The Agile Manifesto was already a reaction to bloated teams. AI doesn't just improve the process — it removes the need for parts of it. The coordination overhead that justified half of Scrum's ceremonies simply evaporates when there are only three people in the room.

### Product Owners and Requirements

The Product Owner role in Scrum was built around a specific bottleneck: translating business needs into stories that a development team could execute. The PO wrote the stories, prioritized the backlog, answered questions during refinement, and validated the output at sprint review. It was a full-time job of translation and alignment.

AI changes this dynamic in two ways.

First, the engineers themselves can now go deeper into requirements without needing the PO in every conversation. An engineer can take a rough business requirement, explore it with AI — asking about edge cases, generating acceptance criteria, mapping out user flows, even prototyping the UI — and come back to the PO with a much more refined understanding. The alignment meetings get shorter and more focused because the team arrives with better questions, not blank stares.

Second, the PO's focus shifts from specification to vision. The [Scrum.org AI4Agile Practitioners Report (2026)](https://www.scrum.org/resources/blog/ai4agile-practitioners-report-2026) suggests that Product Owners in AI-augmented teams spend significantly less time writing detailed stories and more time on strategic prioritization and stakeholder management. Early adopters report a **35% reduction in planning overhead**.

But there's a danger here worth calling out. If the PO becomes too disconnected from the technical reality — because AI handles the translation layer — you lose the human judgment that catches misalignment early. The PO still needs to understand what the team is building. They just don't need to micromanage how it's described in Jira.

### Development Cycles: Faster Than Sprints

The two-week sprint was a compromise. Short enough for meaningful feedback. Long enough to deliver something real. It worked because a team of five to nine humans needed roughly ten working days to go from planning to potentially shippable increment.

But when an AI agent can scaffold an entire feature in a day — and the engineer can review, refine, and validate it in another — what's the two-week boundary for?

Teams are already experimenting. Some have moved to one-week sprints. Others are pushing toward continuous delivery models where the sprint boundary becomes an artificial checkpoint rather than a genuine delivery rhythm. Industry reports cite **40% faster release cycles** in AI-augmented teams.

But faster is not automatically better. Speed without trust creates a different kind of debt. And trust is exactly what's wobbling: **developer confidence in AI-generated code dropped from 69% in 2024 to 54% in 2025**. The most common frustration? Solutions that are "almost right, but not quite." Anyone who's worked with AI agents knows the feeling — code that passes tests, looks clean, and has a subtle logical flaw hiding three layers deep.

This deserves more than a passing mention, because it's the fear that keeps good engineers up at night. "Almost right" at scale means subtle security vulnerabilities that no one catches because the code looks reasonable. It means logic errors that only surface in production under specific conditions — the kind of bug that takes three days to reproduce and another two to understand. It means a new category of technical debt: code that works but that no human fully understands, because it was generated in a pattern the engineer wouldn't have written themselves. [Apiiro's research on Fortune 50 enterprises](https://apiiro.com/blog/4x-velocity-10x-vulnerabilities-ai-coding-assistants-are-shipping-more-risks/) puts hard numbers on this: while AI-assisted developers produce 3-4x more commits, security findings increased 10x. The shallow errors drop — syntax bugs fell 76% — but privilege escalation paths jumped 322% and architectural design flaws spiked 153%. As they put it: "AI is fixing the typos but creating the timebombs." When you move faster, these problems compound. A bug that would have been caught in a two-week review cycle might ship in a three-day cycle before anyone has time to think deeply about it. The speed is real. The risk is also real. And anyone selling you AI-augmented development without acknowledging this tension is either naive or dishonest.

There's a related ceremony that breaks under this pressure: the Sprint Review. In Scrum, the review is where you demo what was built and collect stakeholder feedback. When your cycle time drops to three or four days, do you demo every time? Probably not. But here's the subtler problem — the bottleneck shifts from development speed to stakeholder availability and decision-making speed. [Logilica calls this the "shifting bottleneck paradox"](https://www.logilica.com/blog/the-shifting-bottleneck-conundrum-how-ai-is-reshaping-the-software-development-lifecycle): merge approvals remain 77% human-controlled, and the median engineer at a large company still takes around 13 hours to merge a pull request. Your team can deliver a working feature by Wednesday, but the product manager is in meetings until Friday, and the business stakeholder can't look at it until next Tuesday. The pace AI enables creates an asymmetry: the people building the software move faster than the people who need to validate it. Teams that don't address this will find themselves sitting on finished work waiting for feedback — which is its own kind of waste.

In our team, we're still figuring this out. We haven't abandoned sprints, but we're questioning whether the two-week boundary still makes sense when we can deliver working increments in three to four days. The constraint isn't development time anymore — it's review, validation, and the human confidence to ship.

And that raises another question: when you do ship, what does "done" actually mean now?

### Definition of Done: The New Safety Net

In traditional Scrum, the Definition of Done was a checklist the team agreed on: code reviewed, tests passing, documentation updated, deployed to staging. It was important, but honestly, in many teams it was a formality — the kind of thing you put on a wiki page and forgot about until an auditor asked. [CodeRabbit's 2026 analysis](https://www.coderabbit.ai/blog/2025-was-the-year-of-ai-speed-2026-will-be-the-year-of-ai-quality) argues that while 2025 was the year of AI speed, 2026 is the year of AI quality — and that "correct code" is becoming the new definition of productivity.

With AI writing the code, the Definition of Done becomes the single most important artifact your team has. All the risks I described above — the subtle security flaws, the logic errors that only surface in production, the code no human fully understands — need a defense mechanism. And the DoD is it. That confidence drop I mentioned — **from 69% to 54%** — isn't about AI getting worse. It's about developers gaining enough experience with AI to recognize how often "looks right" and "is right" diverge.

This is where the concept of **workslop** becomes real — a term I touched on in my [previous post]({{ "/ai/tech/engineering/2026/02/17/engineering-2026.html" | relative_url }}). Workslop is AI-generated output that looks professional, compiles cleanly, passes your test suite, and carries subtle flaws that only surface later: a race condition under load, a security vulnerability in an edge case, business logic that handles 95% of scenarios perfectly and silently corrupts data in the other 5%. Without a strong Definition of Done, you ship workslop faster. AI doesn't just increase your velocity — it increases the velocity of your mistakes.

So the DoD evolves. For AI-augmented teams, "done" needs to include AI-specific quality gates: mandatory human review for critical paths and security-sensitive code, automated security scanning on every AI-generated change, regression coverage thresholds that account for the fact that AI tends to solve the happy path brilliantly and miss the edges, and — this one matters more than people think — a clear confidence threshold below which the engineer must manually verify the logic, not just the output. The DoD is how you operationalize trust. It's the framework that lets you move fast without shipping garbage. And paradoxically, it becomes MORE important when development speed increases, not less. The faster you can ship, the more damage a subtle bug can do before anyone notices.

### Estimation: When Velocity Loses Meaning

If there's one Scrum ritual that AI kills outright, it's story point estimation. [The Scrum.org forums are already full of practitioners asking the same question](https://www.scrum.org/forum/scrum-forum/94752/how-approach-story-point-estimation-advent-ai-dev-acceleration-tools) — one team reported completing over 150 story points in a single sprint with a small team using AI tools, completely blowing past their historical velocity. Here's why it breaks. Traditional estimation assumed a roughly predictable relationship between effort and output. A senior developer doing a "5-point story" would take roughly the same time as another senior developer doing a similar "5-point story." Velocity stabilized over a few sprints, and you could forecast with reasonable confidence.

AI blows this up completely. The same task — let's say integrating a new payment provider — might take an agent forty-five minutes on a good day or loop for eight hours on a bad one, depending on how well the problem maps to the agent's training data, how clear your context files are, and whether the third-party API has quirks the model has never seen. The variance is enormous. One sprint your velocity is 40 points. The next it's 15. Not because the team got worse, but because the AI hit a wall on two tasks that "should have been easy."

What replaces story points? Honestly, no one has a great answer yet. Some teams are shifting to pure throughput metrics — how many items moved from "to do" to "done" per cycle, regardless of estimated size. Others track cycle time per item and use that distribution to forecast probabilistically. Some have abandoned estimation entirely, working from a prioritized list and simply pulling the next most important thing. The common thread is a move away from predictive estimation toward flow-based measurement — or as [doubleslash puts it](https://blog.doubleslash.de/en/software-technologien/devops/sprints-in-the-ai-age-ai-coding-agents/): "AI delivers in hours. Why do we still plan in sprints?" And the honest reality is that most teams, including ours, are still experimenting. The old system is broken, and the new one hasn't crystallized yet.

### Retrospectives: Rethinking Reflection

The retrospective is one of Scrum's most valuable ceremonies. Every sprint, the team reflects: what went well, what didn't, what can we improve. It's the engine of continuous improvement. I've seen retrospectives surface critical team dynamics that would have festered for months otherwise.

But with shorter cycles and AI-augmented workflows, the cadence question gets real. If your cycles are one week or less, do you retrospect every single time? At some point, that becomes ceremony for ceremony's sake — the team doesn't have enough new data between retrospectives to generate meaningful insights.

Here's what I'm starting to think about: **a split model**. A full team retrospective every three to five cycles, focused on the things only humans can assess — team dynamics, morale, strategic direction, collaboration quality, personal growth. And in between, an AI-based cycle retrospective that analyzes the data: commit patterns, PR review times, agent success rates, where the agents got stuck, which rule files need updating, what types of tasks still require heavy human intervention.

The human retro stays relational. The AI retro stays operational. Each feeds the other. Your AI retro might surface that agents are failing consistently on a specific type of integration test — that becomes an agenda item for the next human retro, where the team decides whether it's a tooling problem, a rules problem, or a knowledge gap.

This is speculative. We're just starting to explore it. But the principle feels right: use AI for pattern detection and operational analysis, use humans for the things that require empathy, context, and judgment.

### Coordination: The Problem That Solves Itself

One of Agile's core value propositions was managing coordination in teams of five to nine people. The daily standup, the sprint planning, the backlog refinement — all of these are coordination mechanisms. They exist because when you have seven people working on interconnected tasks, you need regular synchronization points to avoid stepping on each other's toes.

With teams of three to four, many of these mechanisms become naturally lighter. The daily standup becomes a quick five-minute sync — or goes async entirely. The elaborate Jira boards with swim lanes and work-in-progress limits simplify because there are only three people pulling from the backlog.

Sprint Planning is where the shift is most dramatic. In traditional Scrum, a planning session for a team of seven could easily consume two to four hours: breaking down stories, discussing technical approaches, estimating, negotiating scope. With AI, most of that preparation work can happen before the meeting even starts. An agent can pre-generate task breakdowns from epics, draft acceptance criteria based on existing patterns, suggest technical approaches by analyzing the codebase, and even flag risks from similar past implementations. Planning shifts from a creation session to a validation session — the team reviews, challenges, and refines what AI prepared rather than building everything from scratch. For a team of three to four, this can shrink planning from half a day to thirty minutes. Backlog refinement follows the same pattern: AI-assisted pre-refinement generates the first draft, and the team's job becomes quality control and strategic prioritization rather than specification work.

This isn't about eliminating communication. It's about recognizing that smaller teams naturally communicate better. Brooks knew this in 1975. Three people sitting in the same room (or the same Slack channel) don't need a formal ceremony to stay aligned. They just talk. The process overhead that made sense for larger teams becomes friction when the team is small enough to coordinate organically.

### The Scrum Master: A Role in Transformation

The Scrum Master was designed to serve a specific purpose: facilitate the ceremonies, remove blockers, protect the team from organizational interference, and coach the team on Agile practices. In larger organizations, a good Scrum Master was worth their weight in gold — the person who kept the gears turning and shielded the team from death by meeting.

In an AI-augmented team of three to four people, much of that role changes. There are fewer blockers to remove because there's less coordination to break down. There are fewer ceremonies to facilitate because the team is small enough to self-organize. The "shield from the organization" function still matters, but it's a smaller percentage of the job.

So what does the Scrum Master become? I think the role evolves toward something we don't have a good name for yet. Think of it as the guardian of AI development practices. Someone who:

- **Defines and maintains the boundaries** for how the team uses AI agents — what can be delegated, what requires human review, what's off-limits
- **Curates the rule files and agent context** — the instructions that govern how agents work, making sure they stay current and effective (this connects directly to what I described in my [previous post]({{ "/ai/tech/engineering/2026/02/17/engineering-2026.html" | relative_url }}) about guidelines and rules)
- **Simplifies the agile flow** — strips away the ceremonies that no longer serve a purpose and designs lightweight rituals that fit the team's actual rhythm
- **Monitors the quality signals** — not just sprint velocity, but agent success rates, code review metrics, confidence scores, and the ratio of human-written to AI-generated code
- **Enriches the rules and practices** — continuously improving how the team interacts with LLMs, documenting what works and what doesn't, sharing patterns across teams

The [Bain & Company 2025 Technology Report](https://www.bain.com/insights/from-pilots-to-payoff-generative-ai-in-software-development-technology-report-2025/) already hints at this transformation: organizations that get the most from AI aren't just deploying tools — they're redesigning roles and processes around them.

The Scrum Master doesn't disappear. But the job description changes from "process facilitator" to "AI practice architect." The framework they preserve is no longer Scrum-by-the-book — it's whatever lightweight process the team actually needs, enriched with AI-driven insights and governed by clear boundaries.

## What Stays, What Goes, What Evolves

Let me try to synthesize all of this.

**What stays:** The core Agile values. Individuals and interactions over processes and tools — that's more relevant than ever when AI threatens to make everything tool-centric. Working software over comprehensive documentation — still true, especially when AI can generate documentation on demand. Responding to change over following a plan — perhaps the most important principle when the rate of change itself is accelerating.

**What goes:** Rigid two-week sprint cadences designed for larger teams. The assumption that you need seven people to deliver a meaningful increment. Retrospectives every cycle that generate the same stale observations. Story point estimation rituals — velocity-based forecasting breaks when AI makes output variance unpredictable, and the hours spent estimating are better spent delivering. The Scrum Master as ceremony facilitator. The Product Owner as story-writing machine. Multi-hour Sprint Planning sessions built around story creation from scratch.

**What evolves:** Sprint length becomes flexible — one week, three days, continuous, whatever matches the team's delivery rhythm. The Definition of Done becomes the critical trust mechanism — expanding from a checklist into a comprehensive quality framework with AI-specific gates for security, confidence thresholds, and mandatory human review on critical paths. Estimation shifts from predictive story points to flow-based metrics like throughput and cycle time. Sprint Planning becomes a validation session instead of a creation session, with AI doing the preparation work. Retrospectives split between human (strategic, relational) and AI (operational, data-driven). The definition of "cross-functional team" shifts from "multiple specialists covering different areas" to "fewer engineers with broader AI-augmented capabilities." The Scrum Master becomes an AI practice architect. The Product Owner becomes a product strategist.

Uncle Bob's argument in **"Clean Agile"** was always that Agile is about discipline and feedback, not about specific rituals. AI amplifies both. More discipline is needed because the consequences of getting it wrong are faster and bigger. More feedback is available because AI can analyze your process in real time.

The key question for every team is this: **which of your current practices exist because they solve a real problem, and which exist because that's how you've always done it?**

## Still figuring it out

I'll be honest — I don't have a new framework to sell you. I'm not going to call it "AI-gile" or invent a certification. What I have is the same thing I had in my last post: observations from the trenches and a conviction that the old playbook needs updating.

The seventeen people who wrote the Agile Manifesto in 2001 didn't know what software development would look like in 2026. But they built something flexible enough to survive twenty-five years. Their fourth value — *responding to change over following a plan* — is perhaps the most ironic and beautiful thing about Agile right now. Because the biggest change Agile needs to respond to... is the change happening to Agile itself.

In my last post I said we don't deliver code — we deliver software solutions for business needs. The same applies to process: **we don't deliver ceremonies — we deliver outcomes.** If your current process helps you deliver better outcomes, keep it. If it doesn't, have the courage to let it go.

We're still figuring it out. All of us. And that's exactly the point.
