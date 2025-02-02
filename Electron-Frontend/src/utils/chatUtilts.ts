export const scrollToBottom = (
  scrollElement: HTMLElement | null,
  behavior: ScrollBehavior = "smooth"
) => {
  if (scrollElement) {
    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior,
    });
  }
};

export const handleScroll = (
  scrollElement: HTMLElement,
  hasUserScrolled: boolean,
  setShowScrollButton: (show: boolean) => void,
  setShouldAutoScroll: (scroll: boolean) => void,
  setHasUserScrolled: (scrolled: boolean) => void
) => {
  const { scrollTop, scrollHeight, clientHeight } = scrollElement;
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
  const needsScroll = scrollHeight > clientHeight;
  setShowScrollButton(!isNearBottom && needsScroll);
  setShouldAutoScroll(isNearBottom);
  if (!hasUserScrolled && !isNearBottom) {
    setHasUserScrolled(true);
  }
};
