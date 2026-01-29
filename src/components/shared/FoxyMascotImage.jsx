import React from 'react';
import { motion } from 'framer-motion';

const FOXY_IMAGE_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/2f56189cf_Gemini_Generated_Image_yyfn0byyfn0byyfn-removebg-preview.png";

export default function FoxyMascotImage({ 
  variant = 'default', // 'default', 'celebrating', 'detective'
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  animated = true,
  className = '',
  glowColor = '#c8ff00'
}) {
  const sizeClasses = {
    sm: 'w-12 h-12 sm:w-16 sm:h-16',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-32 h-32 sm:w-40 sm:h-40',
    xl: 'w-40 h-40 sm:w-48 sm:h-48'
  };

  const imageUrls = {
    default: FOXY_IMAGE_URL,
    celebrating: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/a834b4d7d_image_d204ca79-7fa0-4451-958c-8c77d8c6c16f-removebg-preview.png",
    detective: FOXY_IMAGE_URL
  };

  const ImageComponent = animated ? motion.img : 'img';
  const animationProps = animated ? {
    animate: { y: [0, -10, 0] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  } : {};

  return (
    <div className="relative inline-block">
      <motion.div 
        className="absolute inset-0 rounded-full blur-2xl sm:blur-3xl opacity-50"
        style={{ background: glowColor }}
        animate={animated ? { 
          scale: [1, 1.2, 1], 
          opacity: [0.5, 0.7, 0.5] 
        } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <ImageComponent
        src={imageUrls[variant]}
        alt="Foxy AI Mascot"
        loading="lazy"
        className={`${sizeClasses[size]} object-contain relative z-10 ${className}`}
        style={{ filter: `drop-shadow(0 0 20px ${glowColor})` }}
        {...animationProps}
      />
    </div>
  );
}