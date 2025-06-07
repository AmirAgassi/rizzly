// bufo manager - handles dynamic loading and selection of mascot faces
export interface BufoFace {
  name: string;
  path: string;
  emotion?: string;
  context?: string;
}

class BufoManager {
  private bufoMap: Map<string, string> = new Map();
  private loaded = false;

  // dynamically import all bufo files
  async loadAllBufos() {
    if (this.loaded) return;

    try {
      // use webpack's require.context to load all files from bufopack
      const context = require.context('../bufopack/', false, /\.(png|gif)$/);
      const bufoFiles = context.keys();

      // populate the bufo map
      bufoFiles.forEach(filePath => {
        const fileName = filePath.replace('./', '').replace(/\.(png|gif)$/, '');
        const bufoModule = context(filePath);
        this.bufoMap.set(fileName, bufoModule.default || bufoModule);
      });

      this.loaded = true;
      console.log(`loaded ${this.bufoMap.size} bufo faces! 🐸`);
    } catch (error) {
      console.error('failed to load bufo faces:', error);
    }
  }

  // get a specific bufo by name
  getBufo(name: string): string | null {
    return this.bufoMap.get(name) || null;
  }

  // get all available bufo names
  getAllBufoNames(): string[] {
    return Array.from(this.bufoMap.keys());
  }

  // get a random bufo
  getRandomBufo(): string {
    const names = this.getAllBufoNames();
    const randomName = names[Math.floor(Math.random() * names.length)];
    return this.getBufo(randomName) || this.getBufo('bufo-tea') || '';
  }

  // get bufo based on emotion/context (ai will choose these)
  getBufoByEmotion(emotion: string): string {
    const emotionMap: { [key: string]: string[] } = {
      // happy/positive emotions
      happy: ['bufo-all-good', 'bufo-feels-appreciated', 'bufo-tears-of-joy', 'bufo-blush'],
      excited: ['bufo-extra-cool', 'bufo-boi', 'bufo-happy-hour'],
      confident: ['bufo-fancy-tea', 'bufo-fingerguns-back', 'bufo-fab', 'bufo-fellow-kids'],
      
      // thinking/analytical
      thinking: ['bufo-deep-hmm', 'bufo-brain', 'bufo-anime-glasses'],
      analyzing: ['bufo-hacker', 'bufo-eyes', 'bufo-blank-stare'],
      
      // reactions
      surprised: ['bufo-are-you-seeing-this', 'bufo-amaze', 'bufo-eye-twitch'],
      confused: ['bufo-breakdown', 'bufo-existential-dread-sets-in', 'bufo-facepalm'],
      disappointed: ['bufo-fails-the-vibe-check', 'bufo-awkward-smile', 'bufo-single-tear'],
      
      // supportive/helpful
      supportive: ['bufo-back-pat', 'bufo-feel-better', 'bufo-bless'],
      encouraging: ['bufo-hands', 'bufo-defend', 'bufo-fastest-rubber-stamp-in-the-west'],
      
      // flirty/dating context
      flirty: ['bufo-be-my-valentine', 'bufo-bouquet', 'bufo-box-of-chocolates'],
      romantic: ['bufo-blows-the-magic-conch', 'bufo-breaks-your-heart', 'bufo-feeling-pretty-might-delete-later'],
      
      // casual/chill
      chill: ['bufo-drinking-coffee', 'bufo-tea', 'bufo-fell-asleep', 'bufo-blanket'],
      casual: ['bufo-airpods', 'bufo-headphones', 'bufo-ambiently-existing'],
      
      // default fallbacks
      default: ['bufo-tea', 'bufo-all-good', 'bufo-fancy-tea']
    };

    const candidates = emotionMap[emotion.toLowerCase()] || emotionMap.default;
    const chosenName = candidates[Math.floor(Math.random() * candidates.length)];
    
    return this.getBufo(chosenName) || this.getBufo('bufo-tea') || '';
  }

  // check if bufo manager is ready
  isLoaded(): boolean {
    return this.loaded;
  }
}

// singleton instance
export const bufoManager = new BufoManager(); 