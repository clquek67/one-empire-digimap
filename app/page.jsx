{
  "meta": {
    "version": "2.0",
    "last_updated": "2026-08-01",
    "expires": "2026-11-01",
    "source": "EnterpriseSG / IMDA PSG Pre-approved Solutions",
    "note": "Refresh quarterly via n8n workflow."
  },
  "grants": {
    "PSG": {
      "name": "Productivity Solutions Grant",
      "admin": "EnterpriseSG / IMDA",
      "support_rate": "Up to 50%",
      "max_claim": "No cap per solution",
      "focus": "Pre-approved digital tools and solutions",
      "best_for": "Q1 foundation tools — accounting, POS, CRM, inventory",
      "url": "https://www.enterprisesg.gov.sg/financial-support/productivity-solutions-grant",
      "eligibility": [
        "Registered and operating in Singapore",
        "At least 30% local shareholding",
        "Annual turnover < S$100M OR < 200 employees"
      ]
    },
    "EDG": {
      "name": "Enterprise Development Grant",
      "admin": "EnterpriseSG",
      "support_rate": "Up to 50%",
      "max_claim": "No fixed cap",
      "focus": "Core capabilities, innovation, internationalisation",
      "best_for": "Q3-Q4 — branding, process redesign, market expansion strategy",
      "url": "https://www.enterprisesg.gov.sg/financial-support/enterprise-development-grant",
      "eligibility": [
        "Registered and operating in Singapore",
        "At least 30% local shareholding",
        "Annual turnover < S$500M"
      ]
    },
    "MRA": {
      "name": "Market Readiness Assistance Grant",
      "admin": "EnterpriseSG",
      "support_rate": "Up to 50%",
      "max_claim": "S$100,000 per new market",
      "focus": "Overseas market setup, business development, market research",
      "best_for": "Q4 growth — expanding to Malaysia, Indonesia, Philippines",
      "url": "https://www.enterprisesg.gov.sg/financial-support/market-readiness-assistance-grant",
      "eligibility": [
        "Registered and operating in Singapore",
        "At least 30% local shareholding",
        "Annual turnover < S$100M OR < 200 employees",
        "Must be entering a new overseas market"
      ]
    },
    "SFEC": {
      "name": "SkillsFuture Enterprise Credit",
      "admin": "SkillsFuture Singapore",
      "support_rate": "Up to 90% course fee subsidy + S$10,000 credit",
      "max_claim": "S$10,000 credit per enterprise",
      "focus": "Workforce training and skills upgrading",
      "best_for": "Q1-Q2 — upskilling staff on new digital tools",
      "url": "https://www.skillsfuture.gov.sg/sfec",
      "eligibility": [
        "Registered and operating in Singapore",
        "At least 3 Singapore Citizens or PRs",
        "Must contribute to employees CPF"
      ]
    },
    "CTO-a-S": {
      "name": "CTO-as-a-Service",
      "admin": "IMDA",
      "support_rate": "Up to 70%",
      "max_claim": "S$8,000 per company",
      "focus": "Technology advisory and digital roadmap consultation",
      "best_for": "Q1 — getting expert tech advice before committing to tools",
      "url": "https://www.imda.gov.sg/how-we-can-help/smes-go-digital/cto-as-a-service",
      "eligibility": [
        "Registered and operating in Singapore",
        "SME with fewer than 200 employees",
        "Annual turnover < S$100M"
      ]
    }
  },
  "grant_info": {
    "name": "Productivity Solutions Grant (PSG)",
    "administrated_by": "EnterpriseSG",
    "max_support_rate": "50%",
    "eligibility": [
      "Registered and operating in Singapore",
      "At least 30% local shareholding",
      "Annual sales turnover < S$100M OR < 200 employees"
    ]
  },
  "sector_map": {
    "F&B / Café / Restaurant": "Food Services",
    "Retail Fashion / Apparel": "Retail",
    "Hardware / Home Supplies": "Retail",
    "Beauty / Wellness / Salon": "Retail",
    "Education / Tuition Centre": "Training and Adult Education",
    "Professional Services": "Financial Services",
    "Logistics / Delivery": "Logistics",
    "Other": "Retail"
  },
  "solutions": {
    "accounting": {
      "category": "Financial Management",
      "psg_eligible": true,
      "solutions": [
        { "name": "Xero", "pricing": "S$35-90/mo", "psg_vendor": true },
        { "name": "QuickBooks Online", "pricing": "S$30-75/mo", "psg_vendor": true },
        { "name": "Financio", "pricing": "S$25-60/mo", "psg_vendor": true }
      ]
    },
    "payments": {
      "category": "Digital Payments",
      "psg_eligible": false,
      "solutions": [
        { "name": "PayNow QR", "pricing": "Free", "psg_vendor": false },
        { "name": "Stripe", "pricing": "2.2% + S$0.35 per txn", "psg_vendor": false },
        { "name": "HitPay", "pricing": "Free setup", "psg_vendor": false }
      ]
    },
    "pos": {
      "category": "Point-of-Sale",
      "psg_eligible": true,
      "solutions": [
        { "name": "Lightspeed Retail", "pricing": "S$100-200/mo", "psg_vendor": true },
        { "name": "Shopify POS", "pricing": "S$50-100/mo", "psg_vendor": true }
      ]
    },
    "ecommerce": {
      "category": "E-Commerce",
      "psg_eligible": true,
      "solutions": [
        { "name": "Shopify", "pricing": "S$50-250/mo", "psg_vendor": true },
        { "name": "Shopee Store", "pricing": "Commission-based", "psg_vendor": false },
        { "name": "Lazada Store", "pricing": "Commission-based", "psg_vendor": false }
      ]
    },
    "crm": {
      "category": "Customer Relationship Management",
      "psg_eligible": true,
      "solutions": [
        { "name": "HubSpot CRM", "pricing": "Free-S$180/mo", "psg_vendor": true },
        { "name": "Zoho CRM", "pricing": "S$20-60/user/mo", "psg_vendor": true }
      ]
    },
    "inventory": {
      "category": "Inventory Management",
      "psg_eligible": true,
      "solutions": [
        { "name": "inFlow Inventory", "pricing": "S$80-200/mo", "psg_vendor": true },
        { "name": "Cin7", "pricing": "S$150-300/mo", "psg_vendor": true }
      ]
    },
    "hr_scheduling": {
      "category": "HR & Scheduling",
      "psg_eligible": true,
      "solutions": [
        { "name": "Deputy", "pricing": "S$30-60/mo", "psg_vendor": true },
        { "name": "Talenox", "pricing": "S$30-80/mo", "psg_vendor": true }
      ]
    },
    "marketing": {
      "category": "Digital Marketing",
      "psg_eligible": true,
      "solutions": [
        { "name": "Meta Business Suite", "pricing": "Ad spend based", "psg_vendor": false },
        { "name": "Google Business Profile", "pricing": "Free", "psg_vendor": false },
        { "name": "Mailchimp", "pricing": "Free-S$70/mo", "psg_vendor": false }
      ]
    },
    "analytics": {
      "category": "Data Analytics",
      "psg_eligible": true,
      "solutions": [
        { "name": "Google Analytics 4", "pricing": "Free", "psg_vendor": false },
        { "name": "Power BI", "pricing": "S$15/user/mo", "psg_vendor": false }
      ]
    }
  },
  "skillsfuture_courses": {
    "digital_basics": {
      "title": "Digital Literacy for Business",
      "provider": "SkillsFuture Singapore",
      "funding": "Up to 90% SSG subsidy"
    },
    "ecommerce": {
      "title": "E-Commerce for SMEs",
      "provider": "Shopee / Lazada Academy + SSG",
      "funding": "Up to 70% subsidy"
    },
    "data_analytics": {
      "title": "Data Analytics for Business Decisions",
      "provider": "NTUC LearningHub / Kaplan",
      "funding": "Up to 70% SSG subsidy"
    },
    "digital_marketing": {
      "title": "Digital Marketing Fundamentals",
      "provider": "General Assembly / Equinet Academy",
      "funding": "Up to 70% SSG subsidy"
    }
  },
  "sea_markets": {
    "MY": {
      "name": "Malaysia",
      "grant": "MRA",
      "platforms": ["Shopee MY", "Lazada MY", "PGMall"],
      "payment": "FPX, GrabPay, Touch n Go",
      "readiness_factors": ["Halal certification", "Bahasa Malaysia content", "MySST registration"]
    },
    "ID": {
      "name": "Indonesia",
      "grant": "MRA",
      "platforms": ["Tokopedia", "Shopee ID", "Bukalapak"],
      "payment": "GoPay, OVO, QRIS",
      "readiness_factors": ["NIB registration", "Bahasa Indonesia content", "Local partner"]
    },
    "PH": {
      "name": "Philippines",
      "grant": "MRA",
      "platforms": ["Shopee PH", "Lazada PH", "Zalora"],
      "payment": "GCash, Maya, COD",
      "readiness_factors": ["SEC registration", "Filipino content", "Local logistics partner"]
    }
  }
}
