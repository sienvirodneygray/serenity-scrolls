/**
 * Amazon Attribution URLs
 * 
 * Each channel has a unique Attribution tag URL that allows Amazon to track
 * which social channel or website drove the traffic/purchase.
 * 
 * Campaign: Scrolls-Social and Website
 */

export const AMAZON_ATTRIBUTION_URLS = {
  /** YouTube - Social channel */
  youtube: "https://www.amazon.com/SERENITY-SCROLLS-Scrolls-Scriptures-Inspirational/dp/B0F1HKXBFM?maas=maas_adg_79129CDC244ABAEC54A5025356D4A30F_afap_abs&ref_=aa_maas&tag=maas",

  /** Facebook - Social channel */
  facebook: "https://www.amazon.com/SERENITY-SCROLLS-Scrolls-Scriptures-Inspirational/dp/B0F1HKXBFM?maas=maas_adg_A690ED07EA3DF3E4E4072421C3EB09F1_afap_abs&ref_=aa_maas&tag=maas",

  /** LinkedIn - Social channel */
  linkedin: "https://www.amazon.com/SERENITY-SCROLLS-Scrolls-Scriptures-Inspirational/dp/B0F1HKXBFM?maas=maas_adg_A2750E87D71F55E7A8C732DA6E14E3BA_afap_abs&ref_=aa_maas&tag=maas",

  /** SS Website - Search channel (used on the Serenity Scrolls website) */
  website: "https://www.amazon.com/SERENITY-SCROLLS-Scrolls-Scriptures-Inspirational/dp/B0F1HKXBFM?maas=maas_adg_88C326845D40DB4FA8EC080EEA990DB0_afap_abs&ref_=aa_maas&tag=maas",

  /** TikTok - Social channel */
  tiktok: "https://www.amazon.com/SERENITY-SCROLLS-Scrolls-Scriptures-Inspirational/dp/B0F1HKXBFM?maas=maas_adg_7D8B8B17349031DC54CCAC725E116CFD_afap_abs&ref_=aa_maas&tag=maas",

  /** Instagram - Social channel */
  instagram: "https://www.amazon.com/SERENITY-SCROLLS-Scrolls-Scriptures-Inspirational/dp/B0F1HKXBFM?maas=maas_adg_89659D437E8DFE3933C14D01B2EE2C84_afap_abs&ref_=aa_maas&tag=maas",
} as const;

/** The Attribution URL to use on the Serenity Scrolls website */
export const WEBSITE_AMAZON_URL = AMAZON_ATTRIBUTION_URLS.website;
