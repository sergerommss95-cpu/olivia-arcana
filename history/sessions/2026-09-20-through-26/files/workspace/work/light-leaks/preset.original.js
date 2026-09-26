// Exact licensed Shaders MCP export: Light Leaks 1.
// Preset 14ca0e55-b724-455f-b2d8-126e1e38bb80. Values and component IDs preserved.
export const preset = {
  components: [
    {
      type: 'Swirl',
      id: 'idm8k2p9x7',
      props: {
        blend: 40,
        colorA: '#0a1628',
        colorB: '#4a7bb5',
        colorSpace: 'oklch',
        detail: 2.5,
        speed: 0.5,
      },
    },
    {
      type: 'Blob',
      id: 'idp4j9n2w5',
      props: {
        center: {
          x: 0.3,
          y: 0.35
        },
        colorA: '#00ffff',
        colorB: '#0080ff',
        colorSpace: 'oklch',
        deformation: 1.5,
        highlightColor: '#ffffff',
        highlightIntensity: 0.6,
        size: 0.6,
        softness: 3,
        speed: 0.8,
      },
    },
    {
      type: 'Blob',
      id: 'idr7m3k8q1',
      props: {
        center: {
          x: 0.7,
          y: 0.65
        },
        colorA: '#ff00ff',
        colorB: '#ff0080',
        colorSpace: 'oklch',
        deformation: 1.8,
        highlightColor: '#ffffff',
        highlightIntensity: 0.7,
        softness: 3.5,
        speed: 0.7,
        visible: true,
      },
    },
    {
      type: 'ChromaticAberration',
      id: 'idca8x4m2p',
      props: {
        angle: 45,
        blueOffset: 1.5,
        redOffset: -1.5,
        strength: 0.55,
      },
    },
    {
      type: 'FilmGrain',
      id: 'idf6k2m9r4',
      props: {
        strength: 0.08,
      },
    }
  ]
};
