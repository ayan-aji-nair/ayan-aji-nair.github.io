export type Project = {
    title: string
    description: string
    href: string
  }
  
  export const projects: Project[] = [
    {
      title: 'matrix multiplication optimization using ipc',
      description: 'using inter-process communication, avx2 instructions, cache optimizations, and more, i made matmul 10x faster on cpu.',
      href: 'https://github.com/ayan-aji-nair/matmul-optimization'
    },
    {
      title: 'user-level threading library',
      description: 'i created my own version of pthreads.',
      href: 'https://github.com/ayan-aji-nair/os-project-2'
    },
    {
      title: 'ancient chinese art generator',
      description: 'a generative adverserial network that i trained to generate ancient chinese art. check my medium for an article about it!',
      href: 'https://github.com/ayan-aji-nair/art-generation-gan'
    }
    // Add/remove items freely — the UI updates automatically.
  ]
  