import React from "react";
import { Composition } from "remotion";
import { ProEdit, calcProEdit } from "./ProEdit";
import { SafeTemplate } from "./safe";
import { Showcase, calcShowcase } from "./Showcase";
import { ClaudeChat, PromptResult, WrapperProps, calcWrapper } from "./Wrappers";

const wrapperDefaults: WrapperProps = {
  slug: "teen",
  handle: "some_editor",
  comment: "ИИ не умеет монтировать.",
  skill: "max-motion",
  prompt: "Смонтируй в моём стиле.",
  steps: ["Вырезал паузы", "Слово за головой", "Фото + чек-лист", "Наезды + тряска", "Звук"],
  title: "Я НЕ МОНТИРОВАЛ",
  sub: "Claude смонтировал, одним скиллом",
  tint: "#3D5BFF",
};

const base = { durationInFrames: 150, fps: 30, width: 1080, height: 1920 } as const;

export const Root: React.FC = () => (
  <>
    <Composition id="ProEdit" component={ProEdit} calculateMetadata={calcProEdit} {...base} defaultProps={{ slug: "teen" }} />
    <Composition
      id="Showcase"
      component={Showcase}
      calculateMetadata={calcShowcase}
      {...base}
      defaultProps={{
        slug: "teen",
        handle: "hater_2026",
        comment: "ИИ не умеет монтировать.",
        kicker: "Серьёзно…",
        title: "CLAUDE",
        sub: "смонтировал это?",
        terminal: ["Render reel.mp4?", "› 1. Да", "  2. Да, и больше не спрашивай", "  3. Нет"],
        tint: "#3D5BFF",
      }}
    />
    {/* transparent safe-zone template, one platform per still (`mm safezones`) */}
    <Composition id="SafeZone" component={SafeTemplate} {...base} durationInFrames={1} defaultProps={{ platform: "all" as const }} />
    <Composition id="ClaudeChat" component={ClaudeChat} calculateMetadata={calcWrapper} {...base} defaultProps={wrapperDefaults} />
    <Composition id="PromptResult" component={PromptResult} calculateMetadata={calcWrapper} {...base} defaultProps={wrapperDefaults} />
  </>
);
