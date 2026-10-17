export interface GifAsset {
  id: string;
  title: string;
  category: string;
  url: string;
  previewUrl: string;
  fileName: string;
  source?: any;
}

export const GIFS: GifAsset[] = [
  // Laugh
  {
    id: 'gif-laugh',
    title: 'Laughing',
    category: 'Laugh',
    url: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/200w.gif',
    fileName: 'laughing.gif',
    source: { uri: 'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/200w.gif' }
  },
  {
    id: 'gif-rofl',
    title: 'ROFL',
    category: 'Laugh',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/10JhviFuU2gWD6/200w.gif',
    fileName: 'rofl.gif',
    source: { uri: 'https://media.giphy.com/media/10JhviFuU2gWD6/200w.gif' }
  },
  {
    id: 'gif-giggle',
    title: 'Giggle',
    category: 'Laugh',
    url: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/200w.gif',
    fileName: 'giggle.gif',
    source: { uri: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/200w.gif' }
  },

  // Love
  {
    id: 'gif-heart',
    title: 'Beating Heart',
    category: 'Love',
    url: 'https://media.giphy.com/media/26BRv0ThflsDTqUXa/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/26BRv0ThflsDTqUXa/200w.gif',
    fileName: 'beating-heart.gif',
    source: { uri: 'https://media.giphy.com/media/26BRv0ThflsDTqUXa/200w.gif' }
  },
  {
    id: 'gif-hug',
    title: 'Sending Love',
    category: 'Love',
    url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/200w.gif',
    fileName: 'sending-love.gif',
    source: { uri: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/200w.gif' }
  },

  // Party
  {
    id: 'gif-party',
    title: 'Party Popper',
    category: 'Party',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif',
    fileName: 'party-popper.gif',
    source: { uri: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif' }
  },
  {
    id: 'gif-dance',
    title: 'Dance',
    category: 'Party',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif',
    fileName: 'dance.gif',
    source: { uri: 'https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif' }
  },
  {
    id: 'gif-congrats',
    title: 'Congratulations',
    category: 'Party',
    url: 'https://media.giphy.com/media/qx8pi39Lwm9Xm2audb/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/qx8pi39Lwm9Xm2audb/200w.gif',
    fileName: 'congratulations.gif',
    source: { uri: 'https://media.giphy.com/media/qx8pi39Lwm9Xm2audb/200w.gif' }
  },
  {
    id: 'gif-cheers',
    title: 'Cheers Toast',
    category: 'Party',
    url: 'https://media.giphy.com/media/Zw3oBUuIg23EWushUX/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/Zw3oBUuIg23EWushUX/200w.gif',
    fileName: 'cheers.gif',
    source: { uri: 'https://media.giphy.com/media/Zw3oBUuIg23EWushUX/200w.gif' }
  },

  // Clap
  {
    id: 'gif-applause',
    title: 'Applause',
    category: 'Clap',
    url: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1GhO/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1GhO/200w.gif',
    fileName: 'applause.gif',
    source: { uri: 'https://media.giphy.com/media/l3q2XhfQ8oCkm1GhO/200w.gif' }
  },
  {
    id: 'gif-standing-ovation',
    title: 'Ovation',
    category: 'Clap',
    url: 'https://media.giphy.com/media/srg19CG0cKNu0/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/srg19CG0cKNu0/200w.gif',
    fileName: 'ovation.gif',
    source: { uri: 'https://media.giphy.com/media/srg19CG0cKNu0/200w.gif' }
  },

  // Fire
  {
    id: 'gif-fire',
    title: 'Lit Fire',
    category: 'Fire',
    url: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/200w.gif',
    fileName: 'fire.gif',
    source: { uri: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/200w.gif' }
  },
  {
    id: 'gif-lit',
    title: 'Super Lit',
    category: 'Fire',
    url: 'https://media.giphy.com/media/nrXif9YjgW9EI/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/nrXif9YjgW9EI/200w.gif',
    fileName: 'super-lit.gif',
    source: { uri: 'https://media.giphy.com/media/nrXif9YjgW9EI/200w.gif' }
  },

  // Sad
  {
    id: 'gif-cry',
    title: 'Tears Sad',
    category: 'Sad',
    url: 'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/d2lcHJTG5Tscg/200w.gif',
    fileName: 'tears-sad.gif',
    source: { uri: 'https://media.giphy.com/media/d2lcHJTG5Tscg/200w.gif' }
  },
  {
    id: 'gif-sad-cat',
    title: 'Sad Pout',
    category: 'Sad',
    url: 'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/OPU6wzx8JrHna/200w.gif',
    fileName: 'sad-pout.gif',
    source: { uri: 'https://media.giphy.com/media/OPU6wzx8JrHna/200w.gif' }
  },

  // Cool
  {
    id: 'gif-cool',
    title: 'Deal With It',
    category: 'Cool',
    url: 'https://media.giphy.com/media/62PP2yEIAZF6g/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/62PP2yEIAZF6g/200w.gif',
    fileName: 'deal-with-it.gif',
    source: { uri: 'https://media.giphy.com/media/62PP2yEIAZF6g/200w.gif' }
  },
  {
    id: 'gif-sunglasses',
    title: 'Too Cool',
    category: 'Cool',
    url: 'https://media.giphy.com/media/3o7btUg31OCi0NXdkY/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/3o7btUg31OCi0NXdkY/200w.gif',
    fileName: 'too-cool.gif',
    source: { uri: 'https://media.giphy.com/media/3o7btUg31OCi0NXdkY/200w.gif' }
  },

  // Bye
  {
    id: 'gif-bye',
    title: 'Wave Goodbye',
    category: 'Bye',
    url: 'https://media.giphy.com/media/m9eG1qVjvN56HexfcE/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/m9eG1qVjvN56HexfcE/200w.gif',
    fileName: 'goodbye.gif',
    source: { uri: 'https://media.giphy.com/media/m9eG1qVjvN56HexfcE/200w.gif' }
  },
  {
    id: 'gif-peace-out',
    title: 'Peace Out',
    category: 'Bye',
    url: 'https://media.giphy.com/media/Ru9sjtZ09XOEg/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/Ru9sjtZ09XOEg/200w.gif',
    fileName: 'peace-out.gif',
    source: { uri: 'https://media.giphy.com/media/Ru9sjtZ09XOEg/200w.gif' }
  }
];

export const GIF_SOURCES: Record<string, any> = {};

export function getLocalGifSource(keyOrUrl?: string): any {
  if (!keyOrUrl || typeof keyOrUrl !== 'string') return null;
  const match = GIFS.find((g) => g.id === keyOrUrl || g.fileName === keyOrUrl || g.url === keyOrUrl);
  return match?.source || null;
}
