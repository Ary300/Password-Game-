import { motion, useReducedMotion } from 'motion/react'

// The banner sweeping in with the new team's color is the hand-off moment the room watches for.
export default function TeamBanner({ teamName, teamColor }: { teamName: string; teamColor: string }) {
  // Starting off-screen for even one frame is motion a reduced-motion user asked not to see, so skip the start state.
  const theReduced = useReducedMotion()
  let theBannerStart: false | { x: string } = { x: '-102%' }
  let theNameStart: false | { opacity: number; x: number } = { opacity: 0, x: -60 }
  if (theReduced === true) {
    theBannerStart = false
    theNameStart = false
  }
  return (
    <div className="-ml-[clamp(20px,4vh,48px)] overflow-hidden">
      <motion.div
        initial={theBannerStart}
        animate={{ x: '0%' }}
        transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
        className="varsity-cut mesh py-[2vh] pr-24 pl-[clamp(20px,4vh,48px)]"
        style={{ backgroundColor: teamColor }}
      >
        <motion.h1
          initial={theNameStart}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="display truncate pt-[0.06em] text-[clamp(96px,20vh,280px)] text-gold-ink"
        >
          {teamName}
        </motion.h1>
      </motion.div>
    </div>
  )
}
