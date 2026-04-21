// ========= إعداداتك هنا =========
const WHATSAPP_NUMBER = "218920920500"; // غيره لرقم المحل بصيغة دولية بدون +
const SHOP_NAME = "كورتور للأزياء - COUTURE";
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
