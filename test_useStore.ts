import { useStore } from './src/store/useStore';
useStore.getState().invalidateCache();
console.log("Works!");
