# HUNT Commerce Navigation Hierarchy — 2026-09-27

## Goal

Make HUNT easy to browse without changing or weakening canonical taxonomy.

Canonical truth remains:

Department → Category → Exact Shelf → Products

The new navigation layer groups existing canonical categories for faster discovery. It does not reclassify products.

## Research pattern applied

Large fashion-commerce sites commonly use:
- high-level shopping groups,
- product-type sub-navigation,
- exact product families under broad departments,
- breadcrumb / filter continuity,
- separate footwear subtypes,
- separate lingerie / nightwear subtypes.

HUNT adopts the navigation pattern while keeping its own Cinematic identity and fail-closed taxonomy.

## Grouped departments

### Women
- Clothing
- Lingerie & Sleep
- Shoes
- Swim
- Occasion
- Complete the look → Accessories / Beauty (separate departments)

### Men
- Clothing
- Underwear & Basics
- Shoes & Bags
- Accessories

### Kids & Baby
- Kids
- Baby Clothing
- Baby Essentials

### Accessories
- Jewelry
- Bags & Small Accessories
- Wear
- Hair & Basics

### Tech
- Phone Essentials
- Audio & Wearables
- Devices & Home
- Computer & Gaming

### Home
- Decor
- Textiles & Windows
- Storage & Furniture
- Care & Utility

### Pets
- Everyday
- Play & Care
- Comfort
- Aquarium

### Sports
- Training
- Outdoor & Cycling
- Gear & Bags

All grouped departments were programmatically checked:
- no missing configured category
- no duplicate category
- no unknown category
- JavaScript syntax check PASS

## Women product-type views

These are presentation filters inside an existing canonical shelf. They do NOT create or mutate taxonomy routes.

### Underwear & Bras
- Bras
- Briefs & Knickers
- Thongs
- Lingerie Sets
- Shapewear
- Bodysuits

### Sleepwear
- Pajamas
- Nightwear
- Robes & Dressing Gowns
- Sleep Sets

### Shoes
- Sneakers & Trainers
- Heels
- Sandals
- Boots
- Flats & Loafers
- Slippers

### Swimwear
- Bikinis
- One-Piece
- Cover-Ups

### Dresses
- Mini
- Midi
- Maxi

A type with zero gated products is disabled rather than filled from another shelf.

## Current Women inventory truth

Current Profit+Stock pipeline includes:
- Women Shoes: 548
- Women Outerwear: 256
- Women Knitwear: 137
- Women Tops: 54
- Women Hoodies: 27
- Women Sleepwear: 21
- Women Skirts: 21
- Women Socks: 16
- Women Evening: 15
- Women Underwear: 3

Current Shadow-ready counts include:
- Sleepwear: 15
- Evening: 6
- Knitwear: 2
- Skirts: 2
- Socks: 2
- Underwear: 1
- Hoodies: 1
- Outerwear: 1
- Tops: 1
- Shoes: 0

Missing or currently unpopulated Women canonical shelves still need promotion/sourcing work:
- Dresses
- Suits & Blazers
- Jeans & Denim
- Pants & Shorts
- Swimwear

Women Underwear also needs targeted inventory expansion for:
- Bras
- Thongs
- Briefs / Knickers
- Shapewear
- broader Lingerie Sets

## Safety and commerce truth

Navigation changes do not weaken:
- Taxonomy Gate V2
- Catalog Safety
- Market5
- Image Technical QA
- Profit REVIEW / Final Profit distinction
- Production OFF controls

Empty type views remain empty/disabled.
No product borrowing is allowed to create visual density.

## Responsive access

Desktop:
- grouped mega-menu cards
- exact category buttons
- exact shelf drawer
- product-type filters

Mobile:
- horizontal snap-scroll group cards
- touch-sized controls
- horizontal type filters
- existing sticky HUNT topbar
- existing Product World full-screen flow

## Release state

Preview branch only:
preview/hunt-cinematic-launch-flow-v1

No Netlify deploy was used for this navigation work.
