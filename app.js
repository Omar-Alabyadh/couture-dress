// ========= إعداداتك هنا =========
const WHATSAPP_NUMBER = "218920920500"; // غيره لرقم المحل بصيغة دولية بدون +
const SHOP_NAME = "كوتور للأزياء - COUTURE";
// ===============================

const waBase = `https://wa.me/${WHATSAPP_NUMBER}`;

// WhatsApp links
const whatsHero = document.getElementById("whatsHero");
const whatsFloat = document.getElementById("whatsFloat");
const whatsLink = document.getElementById("whatsLink");

function waLink(message) {
  return `${waBase}?text=${encodeURIComponent(message)}`;
}

const defaultMsg = `مرحباً، أريد الاستفسار عن موديلات ${SHOP_NAME}.`;
[whatsHero, whatsFloat, whatsLink].forEach((a) => {
  if (!a) return;
  a.href = waLink(defaultMsg);
});

// Mobile nav
const navToggle = document.getElementById("navToggle");
const mobileNav = document.getElementById("mobileNav");

navToggle?.addEventListener("click", () => {
  const isOpen = mobileNav.style.display === "block";
  mobileNav.style.display = isOpen ? "none" : "block";
});

mobileNav?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => (mobileNav.style.display = "none"));
});

// Gallery filter
const tabs = document.querySelectorAll(".tab");
const items = document.querySelectorAll(".item");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const filter = tab.dataset.filter;
    items.forEach((it) => {
      const cat = it.dataset.cat;
      it.style.display = filter === "all" || filter === cat ? "flex" : "none";
    });
  });
});

// Order buttons
document.querySelectorAll(".item__btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const title = btn.dataset.title || "قطعة";
    const msg = `مرحباً، أريد طلب/الاستفسار عن: ${title} من ${SHOP_NAME}.`;
    window.open(waLink(msg), "_blank");
  });
});

// Branch map toggle (single iframe)
const BRANCH_MAP = {
  benghazi: {
    title: "فرع بنغازي",
    address:
      "بنغازي - بلعون كوبري الفرش سنتر إيلين في اتجاه شارع فينسيا",
    embed:
      "https://www.google.com/maps?q=32.065307,20.086752&z=17&output=embed",
    openUrl: "https://maps.app.goo.gl/Limcfk7Sh7SLTTEi7?g_st=aw",
  },
  tripoli: {
    title: "فرع طرابلس",
    address: "طرابلس - شارع بن عاشور الرئيسي",
    embed:
      "https://www.google.com/maps?q=%D8%B7%D8%B1%D8%A7%D8%A8%D9%84%D8%B3%D8%8C%20%D8%B4%D8%A7%D8%B1%D8%B9%20%D8%A8%D9%86%20%D8%B9%D8%A7%D8%B4%D9%88%D8%B1%20%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%8C%20%D9%84%D9%8A%D8%A8%D9%8A%D8%A7&z=17&output=embed",
    openUrl: "https://maps.app.goo.gl/Ux1aoXG8iNyiCWAG8?g_st=ic",
  },
};

function applyBranchMap(branchId) {
  const b = BRANCH_MAP[branchId];
  if (!b) return;

  const addressEl = document.getElementById("branchAddressText");
  const iframe = document.getElementById("branchMapIframe");
  const external = document.getElementById("branchMapExternal");
  if (addressEl) addressEl.textContent = b.address;
  if (iframe) {
    iframe.title = `خريطة ${b.title}`;
    iframe.src = b.embed;
  }
  if (external) {
    if (b.openUrl) {
      external.href = b.openUrl;
      external.textContent = `فتح الموقع في خرائط جوجل — ${b.title}`;
      external.style.display = "inline-block";
    } else {
      external.style.display = "none";
      external.removeAttribute("href");
    }
  }

  document.querySelectorAll("[data-branch-map]").forEach((btn) => {
    const active = btn.getAttribute("data-branch-map") === branchId;
    btn.classList.toggle("btn--primary", active);
    btn.classList.toggle("btn--ghost", !active);
  });
}

document.querySelectorAll("[data-branch-map]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-branch-map");
    if (id) applyBranchMap(id);
  });
});

applyBranchMap("benghazi");

// Contact form -> WhatsApp
const form = document.getElementById("contactForm");

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const message = document.getElementById("message").value.trim();

  const msg = `مرحباً، هذه رسالة من موقع ${SHOP_NAME}:
الاسم: ${name}
الهاتف: ${phone}
الرسالة: ${message}`;

  window.open(waLink(msg), "_blank");
});
