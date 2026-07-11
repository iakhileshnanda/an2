import React from 'react';
import { motion } from 'framer-motion';
import projects from '@content/projects.json';
import styles from './Projects.module.css';
import ScrollStack, { ScrollStackItem } from '@components/ScrollStack';
import GlassSurface from '@components/GlassSurface';

const EASE = [0.22, 1, 0.36, 1];

function ProjectCard({ project, index }) {
  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={28}
      backgroundOpacity={0.18}
      saturation={1.3}
      forceFallback
      className={styles.projectGlass}
    >
      <div
        className="p-8 md:p-14 min-h-[44vh] md:min-h-[420px] flex flex-col"
        data-interactive
      >
        {/* index number · name — company */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 mb-6">
          <div className="flex items-baseline gap-4 md:gap-6">
            <span
              className={`font-code text-sm tracking-widest ${
                project.featured ? 'text-[#810100]' : 'text-[#1B1716]/35'
              }`}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="font-monument text-4xl md:text-6xl leading-none text-[#1B1716]">
              {project.name}
            </h3>
          </div>
          <span className="font-code text-xs tracking-widest uppercase text-[#1B1716]/45">
            {project.company}
          </span>
        </div>

        <p className="font-body text-base md:text-lg leading-relaxed text-[#1B1716]/65 max-w-3xl mb-auto">
          {project.description}
        </p>

        {/* tags as one mono line + link — no chip boxes */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 mt-8">
          <p className="font-code text-xs md:text-sm tracking-wide text-[#1B1716]/45">
            {project.tags.join(' · ')}
          </p>
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-code text-xs tracking-widest uppercase text-[#810100] hover:underline"
            >
              &#8599; GitHub
            </a>
          )}
        </div>
      </div>
    </GlassSurface>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="scene-section relative py-24 md:py-32">
      {/* aurora glow the glass refracts */}
      <div className={styles.stackBackdrop} aria-hidden="true" />

      <div className="relative max-w-[1500px] mx-auto px-4 md:px-6">
        <motion.h2
          className={`font-monument text-[#1B1716] text-center mb-10 ${styles.sectionTitle}`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          WORK
        </motion.h2>

        {/* itemDistance is viewport-scale so cards arrive one at a time —
            each card gets its own stretch of scroll before the next stacks */}
        <ScrollStack
          useWindowScroll
          itemDistance={300}
          itemScale={0.04}
          itemStackDistance={18}
          stackPosition="12%"
          scaleEndPosition="6%"
          baseScale={0.82}
        >
          {projects.map((project, i) => (
            <ScrollStackItem key={project.id}>
              <ProjectCard project={project} index={i} />
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </div>
    </section>
  );
}
