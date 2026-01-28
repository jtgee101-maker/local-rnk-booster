import React from 'react';
import { motion } from 'framer-motion';

const mascotImages = {
  chiropractor: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/f685fb07b_image_e1e92fb4-0cac-4502-aab2-7966804f71ca.png',
  landscaping: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/e5856bc6c_image_fcc179d7-2946-4786-8889-8798b0547c14.png',
  auto_repair: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/187fcd9e2_image_66e859df-3f63-4464-9522-a65fc0b499f9.png',
  plumber: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/79aff4470_image_1fa11bf0-524b-4495-8f41-041627a503bd.png',
  roofer: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/fb4f34ebc_image_e83e280e-f84a-465e-9658-b91853417110.png',
  dentist: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/3f79ae31e_image_b889927d-b8d1-4989-a178-a45db30b245a.png',
  hvac: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/b35cc4f75_image_029b4f8a-3246-40dd-9195-7399d4682f28.png',
  contractor: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/112a71914_image_4a6827e0-cd50-4185-bab5-fa7ecf3a2086.png'
};

const categoryMapping = {
  'home_services': 'contractor',
  'medical': 'chiropractor',
  'retail': 'contractor',
  'professional': 'contractor',
  'other': 'contractor',
  'plumbing': 'plumber',
  'hvac': 'hvac',
  'roofing': 'roofer',
  'landscaping': 'landscaping',
  'lawn_care': 'landscaping',
  'auto_repair': 'auto_repair',
  'auto_body': 'auto_repair',
  'dental': 'dentist',
  'chiropractic': 'chiropractor',
  'electrician': 'contractor',
  'contractor': 'contractor'
};

export default function FoxMascot({ 
  category = 'contractor', 
  size = 'md',
  animate = true,
  className = ''
}) {
  const mascotKey = categoryMapping[category] || 'contractor';
  const imageUrl = mascotImages[mascotKey];

  const sizeClasses = {
    sm: 'w-24 h-24 sm:w-32 sm:h-32',
    md: 'w-32 h-32 sm:w-40 sm:h-40',
    lg: 'w-40 h-40 sm:w-48 sm:h-48',
    xl: 'w-48 h-48 sm:w-64 sm:h-64'
  };

  const MascotWrapper = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.6, type: 'spring', bounce: 0.4 }
  } : {};

  return (
    <MascotWrapper
      {...animationProps}
      className={`${sizeClasses[size]} ${className} relative`}
    >
      <motion.img
        src={imageUrl}
        alt="LocalRnk Fox"
        className="w-full h-full object-contain drop-shadow-2xl"
        animate={animate ? {
          y: [0, -8, 0],
        } : {}}
        transition={animate ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      />
    </MascotWrapper>
  );
}