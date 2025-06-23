// Simple demo app that generates logs
console.log('Starting demo application...');
console.error('Warning: This is a demo warning');

let counter = 0;
const interval = setInterval(() => {
  counter++;
  console.log(`Counter: ${counter}`);
  
  if (counter % 3 === 0) {
    console.error(`Error check at count ${counter}`);
  }
  
  if (counter >= 10) {
    console.log('Demo complete!');
    clearInterval(interval);
  }
}, 1000);