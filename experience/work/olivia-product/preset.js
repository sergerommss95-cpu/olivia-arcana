// Licensed Light Leaks 1, recoloured for Olivia Arcana's lapis, ivory and gold.
// Preset 14ca0e55-b724-455f-b2d8-126e1e38bb80. Motion and component IDs preserved.
// OKLAB blends and restrained RGB separation keep the palette coherent.
export const preset = {
  components: [
    {
      type: 'Swirl',
      id: 'idm8k2p9x7',
      props: {
        blend: 40,
        colorA: '#0b192a',
        colorB: '#273f58',
        colorSpace: 'oklab',
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
        colorA: '#375774',
        colorB: '#192c43',
        colorSpace: 'oklab',
        deformation: 1.5,
        highlightColor: '#d8d3be',
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
        colorA: '#6b604c',
        colorB: '#273447',
        colorSpace: 'oklab',
        deformation: 1.8,
        highlightColor: '#d0b986',
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
        strength: 0.06,
      },
    },
    {
      type: 'FilmGrain',
      id: 'idf6k2m9r4',
      props: {
        strength: 0.028,
      },
    }
  ]
};
