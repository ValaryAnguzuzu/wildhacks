Here's the Figma prompt:

---

**FinLife — Figma Design Prompt**

Design a mobile-first web app called **FinLife** — a gamified financial literacy platform. The experience should feel like a premium game, not a finance tool. Think Duolingo meets Notion meets a Gen Z social app. Clean, alive, and motivating.

---

## Visual identity

**Vibe:** Modern Gen Z. Confident without being aggressive. Smart without being corporate. The UI should feel like something you'd actually want to open every morning — not something your HR department made you do.

**Aesthetic references:** Duolingo's gamification energy + Linear's typographic cleanliness + Notion's calm structure + a hint of Spotify's dark warmth. The app should feel premium and playful at the same time.

**Motion principle:** Everything reacts. Buttons spring slightly when tapped. Nodes pulse gently when available. XP numbers count up. Streaks animate when you extend them. The interface should feel alive — not with distracting animations, but with small moments of delight that reward attention.

---

## Color system

Build around four category accent colors, each owning its own world:

| Category    | Color name | Hex       | Feel                                  |
| ----------- | ---------- | --------- | ------------------------------------- |
| Investing   | Teal       | `#0D9488` | Growth, momentum, calm confidence     |
| Budgeting   | Amber      | `#F59E0B` | Warmth, everyday life, approachable   |
| Taxes       | Indigo     | `#6366F1` | Precision, depth, a little mysterious |
| Real Estate | Rose       | `#F43F5E` | Ambition, property, aspiration        |

**Global neutrals:**

- Background: `#0F0F13` (near-black, not pure black — gives depth)
- Surface: `#1A1A23` (cards, modals)
- Surface elevated: `#242433` (hover states, highlighted cards)
- Border subtle: `#2E2E40`
- Text primary: `#F2F2F7`
- Text secondary: `#8E8EA0`
- Text muted: `#52526A`

**No red for errors.** Use a soft coral (`#FF6B6B`) for wrong answers — not alarming, just a gentle signal. Use a vibrant green (`#34D399`) for correct answers. Never use harsh alert colors. This app should never feel punishing.

**Accent highlight:** A global XP gold `#FFB800` used only for XP numbers, streak flames, and achievement moments. Treat it like a precious metal — use sparingly so it always reads as reward.

---

## Typography

**Primary font:** Plus Jakarta Sans (or Inter as fallback). Use it for everything.

**Scale:**

- Display: 32px / 700 — used for celebration moments only ("Perfect!" "Streak saved!")
- Heading: 22px / 600 — screen titles, world names
- Subheading: 17px / 600 — card titles, lesson names
- Body: 15px / 400 — lesson content, descriptions
- Caption: 13px / 400 — labels, metadata, XP counts
- Micro: 11px / 500 uppercase tracked — category pills, status labels

**Rule:** Never use more than 3 type sizes in a single screen. Simplicity creates hierarchy.

---

## Layout and grid

Design all screens at **390px wide** (iPhone 14 base) as the primary canvas. Also design a **tablet breakpoint at 768px** and a **desktop breakpoint at 1280px**.

On mobile: single column, full-bleed cards, bottom navigation.
On tablet: two-column layout with the path on the left, content on the right.
On desktop: three-column layout — left sidebar navigation, center content, right panel for stats/rival.

**Spacing unit:** 8px base. Use multiples: 8, 16, 24, 32, 48.
**Border radius:** Generous. Cards at `radius-20`, buttons at `radius-14`, pills at `radius-999` (fully round), nodes at `radius-999` (circle).

---

## Screens to design

### 1. Onboarding (3 screens)

**Screen 1 — Welcome**
Full-screen with a subtle animated background (think: slow-moving financial symbols — charts, percentages, coins — at very low opacity, almost like a texture). Center-aligned. Large display text: "Money is a skill. Let's build it." Below: a subline in secondary text: "3 minutes a day. Real results." CTA button fills the width, rounded, in a gradient from Teal to Indigo. No sign-in wall yet — just vibes and a "Get started" button.

**Screen 2 — Skill check (3 quick questions)**
Not a quiz — a vibe check. Three questions with illustrated answer cards instead of radio buttons. Question example: "When you think about investing, you feel...". Cards with icons: 😅 "Honestly lost", 🤔 "Curious but unsure", 😎 "Pretty confident". Cards are large tap targets, the selected one gets a glowing border in the accent color. Progress dots at the top. One question per screen, swipe-forward transition.

**Screen 3 — Pick your start**
Four large category cards in a 2×2 grid. Each card has: category name, a short tagline ("Your money, working for you"), a small illustrative icon, and the category color as a subtle background tint. User taps one to highlight it. A "Start learning" button appears below. This is their first category — they can change later.

---

### 2. Home screen

The home screen is the emotional anchor of the app. It should feel like opening a game — not a utility.

**Top section — Status bar**
Three elements in a horizontal row:

- Streak: A small flame icon (animated if active) + the streak number in XP gold. If the streak is at risk, the flame flickers and turns slightly orange. If it's a record streak, add a subtle glow.
- XP total: A small star/diamond icon + total XP in white, caption-sized
- Hearts: 5 small heart icons. Filled hearts in rose, empty in muted gray. When the last heart is lost, they pulse once before going dark.

**Hero card — Today's lesson**
A large card (full width, rounded, surface-elevated background) with a left-accent border in the active category color. Inside: category pill at top, lesson title in subheading size, one-line teaser, and a "Play" button that fills the bottom of the card. The button background is the category gradient. On hover/focus, the card lifts slightly (shadow deepens). A small "~3 min" badge in the top right corner.

**Progress rings — Category overview**
Four circular progress rings in a horizontal scroll row, one per category. Each ring uses the category color. Inside each ring: the category icon. Below each ring: the category name and "X/20 lessons" in caption text. The active category ring is slightly larger and has a more saturated color. Inactive categories are at 60% opacity — present but not demanding attention.

**Motivation strip**
A thin, full-width card below the rings. Rotates through contextual messages: "You're in the top 18% of learners this week", "YOLO is 3 lessons ahead — catch up?", "You've learned 7 concepts. Real investors know these." Text in secondary color, small accent icon on the left.

**Recent activity**
A short list (3 items max) showing the last three lessons completed: lesson name, category color dot, XP earned, time since completed. Simple, clean, no cards — just rows with a thin separator.

**Bottom navigation**
Four tabs: Home (house icon), Learn (map/path icon), Progress (chart icon), Profile (person icon). Active tab shows the icon in the active category color with a small indicator dot below. Inactive tabs in muted color. No labels — icons only on mobile, icons + labels on tablet/desktop.

---

### 3. Category / skill path screen

This is the centrepiece of the app. The **learning journey as a literal path.**

**Layout**
A vertically scrolling screen. The path runs down the center of the screen like a winding road or trail. It should feel like a game map — not a table of contents.

**The path itself**
A continuous curved or gently zigzagging line (SVG path) that connects all lesson nodes. The line is in the category color. The completed portion of the line is fully saturated and bright. The upcoming portion is desaturated and at 30% opacity — it fades into the distance, suggesting there's more to discover.

**World sections**
Every 4–5 nodes, the path enters a new "world" — marked by a larger section header that spans the width of the screen. World headers look like destination signs on a map: a rounded rectangle with the world name ("World 2: Index Investing"), the world number, and how many lessons are complete. When a world is complete, this banner gets a completion badge (a small star or checkmark) and its color goes fully saturated.

**Lesson nodes**
Each node is a circle sitting on the path. Three visual states:

- **Complete:** Filled with category color. White checkmark inside. A very subtle glow. Feels satisfying — done.
- **Available (current):** Larger than the others. Animated — a soft pulse ring expands and fades every 2 seconds (like a radar ping). Category color fill, slightly brighter. An arrow or play icon inside instead of a number. This is where the player is. It should feel magnetic.
- **Locked:** Gray circle, padlock icon inside. No glow. Sits at lower opacity on the faded path.

Nodes alternate left-right as the path winds down — this creates the sense of a journey rather than a straight list. Each node has a small label beneath it (the lesson name, 2–3 words max).

**Special nodes**
Every world ends with a **Boss Challenge node** — slightly larger, a different shape (hexagon or star instead of circle), with a small lightning bolt icon. This is the world-completion scenario quiz. Beating it unlocks the next world with a celebration moment.

**Celebration — World complete**
When a world is completed, a full-screen overlay slides up from the bottom:

- Confetti burst in the category color (particle animation)
- Large bold text: "World 2 complete!"
- Subtext: "You just learned how index investing works. Most people never do."
- XP earned in gold, large, counting up
- Two buttons: "Keep going" (primary) and "Share" (secondary, ghost button)
- After 3 seconds, the overlay auto-dismisses with a spring-out animation

---

### 4. Lesson screen

Clean, focused. No distractions. The user is in a learning session — everything non-essential disappears.

**Header**
Minimal: a back arrow (left), a thin progress bar filling across the full width (shows progress through the lesson), and an XP counter on the right (starts at +0, ticks up as they complete parts).

**Phase 1 — Concept card**
A large card that takes up most of the screen. Category color top border accent (4px, rounded). Inside:

- World + lesson label in micro text at top
- Lesson title in subheading
- Concept explanation in body text — generous line height (1.7), comfortable reading
- Bold takeaway line at the bottom, slightly larger, in the category color
- A subtle background texture (very low opacity category-colored gradient in the card background)

Below the card: a "Got it — test me" button. Wide, rounded, category gradient. When tapped, the card flips or slides out, and the scenario appears.

**Phase 2 — Scenario**
The situation appears in a surface card (slightly different background from the concept card — visual distinction signals mode change).

- A small "Scenario" pill label at top in the category color
- The situation text in body size, conversational tone
- Three choice buttons stacked below. Each is a large rounded card with the choice text. Left-aligned text. Generous padding. On hover: border appears in category color. No colors initially — they all look the same until chosen.

**After choosing:**

- If correct: the chosen button fills with a soft green tint, gets a green border, and a checkmark appears. The others fade to 40% opacity. A bottom sheet slides up from the bottom with the explanation.
- If wrong: the chosen button fills with soft coral tint, gets a coral border, and an X appears. The correct answer gets a green highlight simultaneously — they always see the right answer. Bottom sheet slides up with the "why" explanation.

**Bottom sheet (result)**
Slides up to ~50% screen height. Inside:

- A large icon: ✓ or ✗ at 32px
- A bold line: "Correct!" or "Not quite"
- The explanation in body text
- A concept tag pill (e.g., "Employer match") in the category color — tapping it adds to their glossary
- XP earned (if correct) in XP gold, counting up
- A "Continue" button at the bottom of the sheet

---

### 5. Celebration moments

Design these as their own component — they appear across multiple screens and need to feel special every time.

**XP pop**
A small floating number ("+10 XP") that appears at the point of action and floats upward before fading. In XP gold. Happens every time XP is earned.

**Streak milestone**
When a streak hits 3, 7, 14, 30 days — a special toast notification slides in from the top. Background in XP gold gradient. Flame icon + "7 day streak!" in bold. Stays for 2.5 seconds then slides out. For milestones (30 days), it takes up more screen space and has a mini confetti burst.

**Perfect lesson**
If the user gets all answers right with no wrong answers — a special result screen instead of the normal one. Stars burst from the center. "Perfect!" in display text. A special badge is shown. Extra XP in gold, counting up quickly.

**Level up / world complete**
As described in the skill path section — full-screen celebration overlay. This should be the most dramatic moment in the app. Use the full category color palette, large typography, and particle effects.

**First login of the day**
A subtle welcome-back moment. The home screen loads with a brief personalized greeting card that slides down from the top: "Day 7. You're building something real." Then it collapses into the streak counter.

---

### 6. Profile screen

**Top section**
Avatar (initials-based, in a circle with category color background), display name, join date. Below: a horizontal row of three stat chips — total XP, current streak, lessons completed.

**Streak calendar**
A GitHub-style contribution grid showing the last 30 days. Each day is a small rounded square. Days with a completed lesson are filled in the primary accent color (intensity varies with how many lessons were done — 1 lesson is lighter, 3+ is full saturation). Empty days are muted gray. This makes consistency visually beautiful and motivating.

**Concepts unlocked**
A tag cloud or grid of pill-shaped tags, each representing a concept the user has learned. Each tag is in the color of the category it came from. They accumulate over time — after 30 lessons, this section looks rich and satisfying. Tapping a tag shows a brief definition.

**Category progress**
Four rows, one per category. Each row: category color dot, name, a thin progress bar, and "X/20 lessons" on the right. Clean, dense, informative.

---

## Interaction and motion notes

- **Node pulse:** `scale(1) → scale(1.12) → scale(1)` on a 2s loop with ease-in-out. The pulse ring is a separate circle that expands from scale(1) to scale(1.4) and fades from opacity(0.6) to opacity(0) on the same 2s loop.
- **Button press:** `scale(0.97)` on active, spring back on release. 100ms duration.
- **Card entrance:** Cards slide up from 12px below their final position with fade-in. 200ms, ease-out. Stagger by 60ms if multiple cards load together.
- **XP counter:** Count from 0 to final value over 800ms. Use an ease-out curve so it decelerates as it approaches the final number.
- **Bottom sheet:** Slides up from `translateY(100%)` to `translateY(0)`. 300ms, spring easing. Backdrop darkens behind it.
- **Page transitions:** Horizontal slide between lesson phases. Category screens slide in from the right. Back navigation slides right-to-left.
- **Confetti:** Burst of 40–60 particles in the category color family (3–4 shades). Particles launch from the center in random directions, gravity pulls them down, they fade after 1.2s.

---

## Additional design notes

- Every empty state should be motivating, not neutral. If a category hasn't been started: "This is where it gets interesting." Not "No lessons started."
- The app should never show a number without context. Don't show "1,240 XP" — show "1,240 XP · Level 4". Don't show "$14,200" — show "$14,200 simulated net worth".
- The loading state for lessons should be a skeleton screen in the shape of the content, not a spinner. The skeleton should pulse in the category color at very low opacity.
- Design a "streak at risk" state for the home screen — the flame icon changes, the today's lesson card gets a subtle urgent border, and the message strip says "Your streak ends tonight. 3 mins is all it takes."
- On desktop, add a persistent right panel showing the user's current rival — their name, avatar, XP gap, and last move. This creates ambient social pressure without requiring multiplayer infrastructure.
