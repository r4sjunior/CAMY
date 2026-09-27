import common from './common.glsl?raw';
import fullscreenVert from './fullscreen.vert.glsl?raw';
import cloneVert from './clone.vert.glsl?raw';
import cloneFrag from './clone.frag.glsl?raw';
import feedbackFrag from './feedback.frag.glsl?raw';
import postFrag from './post.frag.glsl?raw';

// O prefixo (precision, uniforms da câmera, etc.) é injetado pelo Three.js.
const withCommon = (src: string) => `${common}\n${src}`;

export const shaders = {
  fullscreenVert: withCommon(fullscreenVert),
  cloneVert: withCommon(cloneVert),
  cloneFrag: withCommon(cloneFrag),
  feedbackFrag: withCommon(feedbackFrag),
  postFrag: withCommon(postFrag),
} as const;
