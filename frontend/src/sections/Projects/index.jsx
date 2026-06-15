import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import projects from '@content/projects.json';
import styles from './Projects.module.css';

function ProjectCard({ project, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [index % 2 === 0 ? -200 : 200, 0]
  );
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ x, opacity }}
      className={`group relative border border-[#1B1716] bg-transparent p-8 md:p-10 transition-colors duration-300 hover:bg-[#1B1716] ${
        index % 2 === 0 ? 'md:mr-auto md:ml-12' : 'md:ml-auto md:mr-12'
      } max-w-xl w-full`}
      data-interactive
    >
      <h3 className="font-monument text-3xl md:text-5xl text-[#1B1716] group-hover:text-[#EDEBDE] transition-colors duration-300 mb-2">
        {project.name}
      </h3>
      <p className="font-code text-xs tracking-widest text-[#1B1716]/50 group-hover:text-[#EDEBDE]/60 uppercase mb-4 transition-colors duration-300">
        {project.company}
      </p>
      <p className="font-body text-sm text-[#1B1716]/60 group-hover:text-[#EDEBDE]/75 mb-6 transition-colors duration-300">
        {project.description}
      </p>
      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-code text-xs tracking-widest text-[#1B1716]/50 group-hover:text-[#EDEBDE] hover:underline uppercase mb-4 inline-block transition-colors duration-300"
        >
          &#8599; GitHub
        </a>
      )}
      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="font-code text-xs px-3 py-1 border border-[#1B1716]/25 group-hover:border-[#EDEBDE]/40 text-[#1B1716]/45 group-hover:text-[#EDEBDE]/70 transition-colors duration-300"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="scene-section min-h-screen py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <h2
          className={`font-monument text-[#1B1716] text-center mb-20 ${styles.sectionTitle}`}
        >
          WORK
        </h2>
        <div className="flex flex-col gap-16 md:gap-24">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
