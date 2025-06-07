// bufo manager - handles dynamic loading and selection of cool bufo faces
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
      const context = (require as any).context('../bufopack/', false, /\.(png|gif)$/);
      const bufoFiles = context.keys();

      // populate the bufo map
      bufoFiles.forEach((filePath: string) => {
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
    const emotionMap: { [key: string]: string } = {
      // happy/positive emotions
      happy: 'bufo-all-good',
      excited: 'bufo-extra-cool',
      confident: 'bufo-fancy-tea',
      
      // thinking/analytical
      thinking: 'bufo-deep-hmm',
      analyzing: 'bufo-hacker',
      
      // reactions
      surprised: 'bufo-are-you-seeing-this',
      confused: 'bufo-breakdown',
      disappointed: 'bufo-fails-the-vibe-check',
      
      // supportive/helpful
      supportive: 'bufo-back-pat',
      encouraging: 'bufo-hands',
      
      // flirty/dating context
      flirty: 'bufo-be-my-valentine',
      romantic: 'bufo-blows-the-magic-conch',
      
      // casual/chill
      chill: 'bufo-drinking-coffee',
      casual: 'bufo-airpods',
      
      // default fallback
      default: 'bufo-tea'
    };

    const chosenName = emotionMap[emotion.toLowerCase()] || emotionMap.default;
    
    return this.getBufo(chosenName) || this.getBufo('bufo-tea') || '';
  }

  // check if bufo manager is ready
  isLoaded(): boolean {
    return this.loaded;
  }
}

export const bufoManager = new BufoManager(); 