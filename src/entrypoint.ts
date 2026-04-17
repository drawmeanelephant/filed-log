import type { Alpine } from 'alpinejs';
import focus from '@alpinejs/focus';

export default (Alpine: Alpine) => {
	// Register the Focus plugin so x-trap is available in all components
	Alpine.plugin(focus);
};
