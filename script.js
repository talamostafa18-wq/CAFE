const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const siteHeader = document.querySelector(".site-header");
const sectionLinks = [...mainNav.querySelectorAll('a[href^="#"]')];
const navSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter((section) => section);

const setActiveLink = (activeSection) => {
  sectionLinks.forEach((link) => {
    if (link.getAttribute("href") === `#${activeSection.id}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const sectionObserver = new IntersectionObserver((entries) => {
  const visibleSections = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

  if (visibleSections[0]) {
    setActiveLink(visibleSections[0].target);
  }
}, { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.1, 0.5] });

navSections.forEach((section) => sectionObserver.observe(section));

const updateHeaderOnScroll = () => {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
updateHeaderOnScroll();

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  mainNav.classList.toggle("is-open", !isOpen);
});

mainNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    mainNav.classList.remove("is-open");
  }
});

const itemDialog = document.querySelector("#item-dialog");
const itemDetailContent = document.querySelector("#item-detail-content");
const bagDialog = document.querySelector("#bag-dialog");
const bagItems = document.querySelector("#bag-items");
const bagCount = document.querySelector("#bag-count");
const bagTotal = document.querySelector("#bag-total");
const bagCheckout = document.querySelector("#bag-checkout");
const orderStatus = document.querySelector("#order-status");
const photoDialog = document.querySelector("#photo-dialog");
const photoDialogImage = document.querySelector("#photo-dialog-image");
const photoCaption = document.querySelector("#photo-caption");
const photoZoom = document.querySelector("#photo-zoom");
const order = new Map();
let selectedItem;
let selectedQuantity = 1;

const menuCards = [...document.querySelectorAll("[data-menu-item]")];
const getMenuItem = (id) => menuCards.find((card) => card.dataset.menuItem === id);

const openItem = (card, addHistory = true) => {
  selectedItem = card;
  selectedQuantity = 1;
  const image = card.querySelector("img");
  const title = card.querySelector("h3").textContent.trim();
  const price = Number(card.dataset.price);

  itemDetailContent.innerHTML = `
    <div class="item-detail">
      <button class="item-detail-image" type="button" aria-label="Enlarge photo of ${title}">
        <img src="${image.src}" alt="${image.alt}">
        <span class="image-zoom-hint">View photo <span aria-hidden="true">⌕</span></span>
      </button>
      <div class="item-detail-copy">
        <p class="eyebrow"><span class="eyebrow-line"></span> A PAHUWAY FAVORITE</p>
        <h2 id="item-title">${title}</h2>
        <p class="item-detail-price">₱ ${price}</p>
        <p class="item-detail-description">${card.dataset.details}</p>
        <div class="ingredient-list"><span>MADE WITH</span><p>${card.dataset.ingredients}</p></div>
        <div class="item-order-row">
          <div class="quantity-control" aria-label="Choose quantity">
            <button type="button" data-quantity="-1" aria-label="Remove one">−</button>
            <output id="item-quantity" aria-live="polite">1</output>
            <button type="button" data-quantity="1" aria-label="Add one">+</button>
          </div>
          <button class="button button-dark add-to-bag" type="button" id="add-to-bag">Add to bag · ₱ ${price}</button>
        </div>
      </div>
    </div>`;

  if (!itemDialog.open) {
    itemDialog.showModal();
  }

  if (addHistory) {
    window.history.pushState(
      { ...(window.history.state || {}), menuItem: card.dataset.menuItem },
      "",
      `#item-${card.dataset.menuItem}`
    );
  }
};

const closeItemAndGoBack = () => {
  if (window.history.state && window.history.state.menuItem) {
    window.history.back();
  } else if (itemDialog.open) {
    itemDialog.close();
  }
};

const updateItemQuantity = () => {
  const quantityOutput = document.querySelector("#item-quantity");
  const addButton = document.querySelector("#add-to-bag");
  const price = Number(selectedItem.dataset.price);
  quantityOutput.value = String(selectedQuantity);
  quantityOutput.textContent = String(selectedQuantity);
  addButton.textContent = `Add to bag · ₱ ${price * selectedQuantity}`;
};

const updateBag = () => {
  const totalCount = [...order.values()].reduce((sum, quantity) => sum + quantity, 0);
  const totalPrice = [...order.entries()].reduce((sum, [id, quantity]) => {
    return sum + Number(getMenuItem(id).dataset.price) * quantity;
  }, 0);

  bagCount.textContent = String(totalCount);
  bagItems.replaceChildren();

  if (totalCount === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "bag-empty";
    emptyMessage.textContent = "Your bag is taking a little rest. Pick a favorite from the menu to get started.";
    bagItems.append(emptyMessage);
    bagTotal.hidden = true;
    bagCheckout.hidden = true;
    return;
  }

  order.forEach((quantity, id) => {
    const card = getMenuItem(id);
    const name = card.querySelector("h3").textContent.trim();
    const line = document.createElement("div");
    line.className = "bag-line";
    line.innerHTML = `
      <div><strong>${name}</strong><span>Qty ${quantity}</span></div>
      <span class="bag-line-price">₱ ${Number(card.dataset.price) * quantity}</span>
      <button class="bag-remove" type="button" data-remove-item="${id}" aria-label="Remove ${name} from bag">×</button>`;
    bagItems.append(line);
  });

  bagTotal.hidden = false;
  bagTotal.innerHTML = `<span>Total</span><span>₱ ${totalPrice}</span>`;
  bagCheckout.hidden = false;
  const orderSummary = [...order.entries()].map(([id, quantity]) => {
    const card = getMenuItem(id);
    return `${card.querySelector("h3").textContent.trim()} x ${quantity}`;
  }).join("\n");
  bagCheckout.href = `mailto:hello@pahuwaycafe.ph?subject=${encodeURIComponent("Pahuway Cafe order request")}&body=${encodeURIComponent(`${orderSummary}\n\nEstimated total: ₱ ${totalPrice}\n\nPlease confirm availability. Thank you!`)}`;
};

menuCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    openItem(card);
  });
});

document.querySelectorAll("[data-close-item]").forEach((button) => {
  button.addEventListener("click", closeItemAndGoBack);
});

itemDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeItemAndGoBack();
});

itemDialog.addEventListener("click", (event) => {
  if (event.target === itemDialog) {
    closeItemAndGoBack();
  }
});

itemDetailContent.addEventListener("click", (event) => {
  if (event.target.closest(".item-detail-image")) {
    const image = selectedItem.querySelector("img");
    photoDialogImage.src = image.src;
    photoDialogImage.alt = image.alt;
    photoCaption.textContent = selectedItem.querySelector("h3").textContent.trim();
    photoDialogImage.classList.remove("is-zoomed");
    photoZoom.textContent = "＋";
    photoZoom.setAttribute("aria-label", "Zoom in on photo");
    photoDialog.showModal();
    return;
  }

  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    selectedQuantity = Math.max(1, selectedQuantity + Number(quantityButton.dataset.quantity));
    updateItemQuantity();
    return;
  }

  if (event.target.closest("#add-to-bag")) {
    const id = selectedItem.dataset.menuItem;
    order.set(id, (order.get(id) || 0) + selectedQuantity);
    updateBag();
    orderStatus.textContent = `${selectedQuantity} ${selectedItem.querySelector("h3").textContent.trim()} added to your bag.`;
    closeItemAndGoBack();
  }
});

photoZoom.addEventListener("click", () => {
  const isZoomed = photoDialogImage.classList.toggle("is-zoomed");
  photoZoom.textContent = isZoomed ? "−" : "＋";
  photoZoom.setAttribute("aria-label", isZoomed ? "Zoom out on photo" : "Zoom in on photo");
});

document.querySelector("#photo-close").addEventListener("click", () => photoDialog.close());

photoDialog.addEventListener("click", (event) => {
  if (event.target === photoDialog) {
    photoDialog.close();
  } else if (event.target === photoDialogImage) {
    const isZoomed = photoDialogImage.classList.toggle("is-zoomed");
    photoZoom.textContent = isZoomed ? "−" : "＋";
    photoZoom.setAttribute("aria-label", isZoomed ? "Zoom out on photo" : "Zoom in on photo");
  }
});

document.querySelector("#open-bag").addEventListener("click", () => {
  updateBag();
  bagDialog.showModal();
});

document.querySelectorAll("[data-close-bag]").forEach((button) => {
  button.addEventListener("click", () => bagDialog.close());
});

bagDialog.addEventListener("click", (event) => {
  if (event.target === bagDialog) {
    bagDialog.close();
  }
  const removeButton = event.target.closest("[data-remove-item]");
  if (removeButton) {
    const id = removeButton.dataset.removeItem;
    const nextQuantity = (order.get(id) || 0) - 1;
    if (nextQuantity > 0) {
      order.set(id, nextQuantity);
    } else {
      order.delete(id);
    }
    updateBag();
  }
});

window.addEventListener("popstate", (event) => {
  if (event.state && event.state.menuItem) {
    const card = getMenuItem(event.state.menuItem);
    if (card) {
      openItem(card, false);
    }
  } else if (itemDialog.open) {
    itemDialog.close();
  }
});
