/**
 * Makes an HTML element draggable using requestAnimationFrame for performance.
 * @param element The element to make draggable.
 */
export function makeDraggable(element: HTMLElement): void {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  let latestClientX = 0;
  let latestClientY = 0;
  let animationFrameId: number | null = null;

  const updatePosition = () => {
    // Calculate new position based on the latest mouse coordinates
    let newX = latestClientX - offsetX;
    let newY = latestClientY - offsetY;

    // Constrain the element within the viewport
    const parentWidth = window.innerWidth;
    const parentHeight = window.innerHeight;
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;

    newX = Math.max(0, Math.min(newX, parentWidth - elementWidth));
    newY = Math.max(0, Math.min(newY, parentHeight - elementHeight));

    // Apply styles
    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
    element.style.right = 'auto'; // Override right positioning
    element.style.bottom = 'auto'; // Override bottom positioning
    element.style.transform = ''; // Ensure transform is not used for positioning

    // Reset for the next frame
    animationFrameId = null;
  };

  const onDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    latestClientX = clientX;
    latestClientY = clientY;

    // If an animation frame is not already scheduled, request one.
    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(updatePosition);
    }
  };

  const startDrag = (clientX: number, clientY: number) => {
    isDragging = true;
    const rect = element.getBoundingClientRect();

    // Using getBoundingClientRect is robust for elements positioned with left/top or right/bottom
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    element.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none'; // Prevent text selection
    
    // Set initial coordinates for the first frame
    latestClientX = clientX;
    latestClientY = clientY;
  };
  
  const stopDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    element.style.cursor = 'grab';
    document.body.style.userSelect = '';

    // Cancel any pending animation frame when dragging stops
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  // Mouse events
  element.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
  document.addEventListener('mousemove', (e) => onDragMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('mouseleave', stopDrag); // Stop if mouse leaves window

  // Touch events for mobile
  element.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault(); // Prevent page scroll
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      onDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  document.addEventListener('touchend', stopDrag);
  document.addEventListener('touchcancel', stopDrag);
  
  // Initial style
  element.style.cursor = 'grab';
}