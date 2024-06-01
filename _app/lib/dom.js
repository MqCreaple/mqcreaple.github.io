function wrapElemIn(tag, elem) {
  const wrapper = document.createElement(tag);
  wrapper.appendChild(elem);
  return wrapper;
}