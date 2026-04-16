/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Onboarding Step Cards - Themed & Responsive
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Beautiful card components for each onboarding step
 * Theme-aware, responsive, with semantic color combinations
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

"use client";

import React from "react";
import { User, GraduationCap, Zap, FolderOpen, Briefcase, Trophy } from "lucide-react";
import {
  OnboardingCard,
  OnboardingFieldGroup,
  OnboardingInput,
} from "./onboarding-layout";

// Step 1: Identity/Personal
export function PersonalStep() {
  return (
    <OnboardingCard
      title="Let's Start with Your Identity"
      description="Add your university IDs and contact information so we can personalize your experience."
      icon={<User className="w-6 h-6" />}
      required
    >
      <OnboardingFieldGroup cols={2}>
        <OnboardingInput
          label="SAP ID"
          placeholder="e.g., 60091234"
          required
        />
        <OnboardingInput
          label="Roll Number"
          placeholder="e.g., A01"
          required
        />
      </OnboardingFieldGroup>

      <div className="h-px bg-border dark:bg-border/50 my-8" />

      <OnboardingFieldGroup cols={2}>
        <OnboardingInput
          label="Phone Number"
          type="tel"
          placeholder="+91 98765 43210"
        />
        <OnboardingInput
          label="LinkedIn Profile"
          type="url"
          placeholder="linkedin.com/in/yourprofile"
        />
      </OnboardingFieldGroup>

      <div className="mt-8 p-4 md:p-5 bg-primary/5 dark:bg-primary/8 border border-primary/20 dark:border-primary/15 rounded-lg">
        <p className="text-xs md:text-sm text-foreground/80 dark:text-foreground/70">
          ℹ️ We keep your information private and only use it for profile verification.
        </p>
      </div>
    </OnboardingCard>
  );
}

// Step 2: Academics
export function AcademicsStep() {
  return (
    <OnboardingCard
      title="Your Academic Journey"
      description="Help us understand your educational background and achievements."
      icon={<GraduationCap className="w-6 h-6" />}
      required
    >
      {/* CGPA & Branch - Primary row */}
      <OnboardingFieldGroup cols={2}>
        <OnboardingInput
          label="CGPA"
          type="number"
          step="0.01"
          min="0"
          max="10"
          placeholder="8.50"
          required
        />
        <div>
          <label
            htmlFor="branch-select"
            className="text-sm font-medium text-foreground dark:text-foreground"
          >
            Branch <span className="text-destructive">*</span>
          </label>
          <select
            id="branch-select"
            className="w-full px-4 py-2.5 md:py-3 rounded-lg border border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/40 focus:border-transparent transition-all duration-150 mt-2"
          >
            <option value="">Select branch...</option>
            <option value="CSE">Computer Science</option>
            <option value="ECE">Electronics</option>
            <option value="ME">Mechanical</option>
            <option value="CE">Civil</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </OnboardingFieldGroup>

      {/* Batch Year & Semester */}
      <OnboardingFieldGroup cols={2}>
        <OnboardingInput
          label="Batch Year"
          type="number"
          min="2020"
          max="2030"
          placeholder="2024"
          required
        />
        <OnboardingInput
          label="Current Semester"
          type="number"
          min="1"
          max="8"
          placeholder="6"
        />
      </OnboardingFieldGroup>

      <div className="h-px bg-border dark:bg-border/50 my-8" />

      {/* Board Percentages */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
          Board Scores
        </h3>
        <OnboardingFieldGroup cols={2}>
          <OnboardingInput
            label="10th Percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="85.50"
            required
          />
          <OnboardingInput
            label="12th Percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="92.75"
            required
          />
        </OnboardingFieldGroup>
      </div>

      <div className="mt-8 p-4 md:p-5 bg-success/5 dark:bg-success/8 border border-success/20 dark:border-success/15 rounded-lg">
        <p className="text-xs md:text-sm text-foreground/80 dark:text-foreground/70">
          ✓ Your academic details help employers understand your background better.
        </p>
      </div>
    </OnboardingCard>
  );
}

// Step 3: Skills
export function SkillsStep() {
  return (
    <OnboardingCard
      title="Showcase Your Skills"
      description="Add technical skills, proficiency levels, and soft skills."
      icon={<Zap className="w-6 h-6" />}
    >
      <div className="space-y-8">
        {/* Technical Skills Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">
              Technical Skills
            </h3>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/70 mb-4">
              Add up to 10 skills with proficiency levels
            </p>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 md:gap-3">
                <input
                  placeholder="React, Python, etc."
                  className="flex-1 px-4 py-2.5 md:py-3 rounded-lg border border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/40 focus:border-transparent transition-all duration-150"
                />
                <select className="w-20 md:w-24 px-3 py-2.5 md:py-3 rounded-lg border border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/40 focus:border-transparent transition-all duration-150">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-border dark:bg-border/50" />

        {/* Soft Skills Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground dark:text-foreground mb-3">
              Soft Skills
            </h3>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/70 mb-4">
              e.g., Leadership, Communication, Problem-solving
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Leadership", "Communication", "Teamwork"].map((skill) => (
              <div
                key={skill}
                className="px-3 py-2 bg-primary/10 dark:bg-primary/15 border border-primary/30 dark:border-primary/25 text-primary dark:text-primary/90 rounded-lg text-xs font-medium hover:bg-primary/20 dark:hover:bg-primary/20 cursor-pointer transition-colors"
              >
                + {skill}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 md:p-5 bg-warning/5 dark:bg-warning/8 border border-warning/20 dark:border-warning/15 rounded-lg">
          <p className="text-xs md:text-sm text-foreground/80 dark:text-foreground/70">
            💡 Highlight your top skills to increase profile visibility to employers.
          </p>
        </div>
      </div>
    </OnboardingCard>
  );
}

// Step 4: Projects
export function ProjectsStep() {
  return (
    <OnboardingCard
      title="Highlight Your Projects"
      description="Share your best academic and personal projects."
      icon={<FolderOpen className="w-6 h-6" />}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground dark:text-muted-foreground/80">
          Add your most impressive projects with descriptions and tech stacks.
        </p>

        {/* Project Card Example */}
        <div className="p-5 md:p-6 border border-border dark:border-border/50 rounded-lg bg-muted/20 dark:bg-muted/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OnboardingInput
              label="Project Title"
              placeholder="AI Recommendation Engine"
              required
            />
            <OnboardingInput
              label="GitHub/Live URL"
              placeholder="https://github.com/..."
            />
          </div>
          <textarea
            placeholder="Describe your project, what problem it solves, and your role..."
            className="w-full px-4 py-3 rounded-lg border border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/40 focus:border-transparent transition-all duration-150 resize-none min-h-[100px]"
          />
          <OnboardingInput
            label="Tech Stack (comma-separated)"
            placeholder="React, Node.js, MongoDB"
          />
        </div>

        <button className="w-full py-2.5 px-4 rounded-lg border border-primary/30 dark:border-primary/25 text-primary dark:text-primary/90 font-medium text-sm hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
          + Add Project
        </button>

        <div className="mt-8 p-4 md:p-5 bg-primary/5 dark:bg-primary/8 border border-primary/20 dark:border-primary/15 rounded-lg">
          <p className="text-xs md:text-sm text-foreground/80 dark:text-foreground/70">
            🎯 Include links to your projects so recruiters can review your work directly.
          </p>
        </div>
      </div>
    </OnboardingCard>
  );
}

// Step 5: Experience
export function ExperienceStep() {
  return (
    <OnboardingCard
      title="Professional Experience"
      description="Add internships, part-time roles, or freelance work."
      icon={<Briefcase className="w-6 h-6" />}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground dark:text-muted-foreground/80">
          Share your work experience to help employers understand your background.
        </p>

        {/* Experience Card Example */}
        <div className="p-5 md:p-6 border border-border dark:border-border/50 rounded-lg bg-muted/20 dark:bg-muted/10 space-y-4">
          <OnboardingFieldGroup cols={2}>
            <OnboardingInput
              label="Company"
              placeholder="Google, Microsoft, Startup..."
              required
            />
            <OnboardingInput
              label="Position"
              placeholder="Software Engineering Intern"
              required
            />
          </OnboardingFieldGroup>

          <OnboardingFieldGroup cols={2}>
            <OnboardingInput
              label="Start Date"
              type="month"
            />
            <OnboardingInput
              label="End Date"
              type="month"
              helperText="Leave empty if current"
            />
          </OnboardingFieldGroup>

          <textarea
            placeholder="Describe your responsibilities, achievements, and learnings..."
            className="w-full px-4 py-3 rounded-lg border border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/40 focus:border-transparent transition-all duration-150 resize-none min-h-[100px]"
          />
        </div>

        <button className="w-full py-2.5 px-4 rounded-lg border border-primary/30 dark:border-primary/25 text-primary dark:text-primary/90 font-medium text-sm hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
          + Add Experience
        </button>

        <div className="mt-8 p-4 md:p-5 bg-success/5 dark:bg-success/8 border border-success/20 dark:border-success/15 rounded-lg">
          <p className="text-xs md:text-sm text-foreground/80 dark:text-foreground/70">
            ✓ Industry experience makes your profile 3x more attractive to employers.
          </p>
        </div>
      </div>
    </OnboardingCard>
  );
}

// Step 6: Achievements/Extras
export function AchievementsStep() {
  return (
    <OnboardingCard
      title="Certifications & Achievements"
      description="Add certifications, research papers, and coding profiles."
      icon={<Trophy className="w-6 h-6" />}
    >
      <div className="space-y-8">
        {/* Certifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
            Certifications
          </h3>
          <div className="space-y-3">
            {[1].map((i) => (
              <div key={i} className="p-4 md:p-5 border border-border dark:border-border/50 rounded-lg bg-muted/20 dark:bg-muted/10 grid grid-cols-1 md:grid-cols-2 gap-3">
                <OnboardingInput
                  label="Certification Name"
                  placeholder="AWS Solutions Architect"
                />
                <OnboardingInput
                  label="Issuing Organization"
                  placeholder="Amazon Web Services"
                />
              </div>
            ))}
          </div>
          <button className="text-sm font-medium text-primary dark:text-primary/90 hover:underline">
            + Add Certification
          </button>
        </div>

        <div className="h-px bg-border dark:bg-border/50" />

        {/* Coding Profiles */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground dark:text-foreground">
            Coding Profiles
          </h3>
          <div className="space-y-3">
            {["LeetCode", "CodeChef", "HackerRank"].map((platform) => (
              <div key={platform} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/70 block mb-2">
                    {platform} Username
                  </label>
                  <input
                    placeholder={`Your ${platform} profile`}
                    className="w-full px-4 py-2.5 md:py-3 rounded-lg border border-input dark:border-input bg-background dark:bg-background text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/40 focus:border-transparent transition-all duration-150"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 md:p-5 bg-primary/5 dark:bg-primary/8 border border-primary/20 dark:border-primary/15 rounded-lg">
          <p className="text-xs md:text-sm text-foreground/80 dark:text-foreground/70">
            🏆 Certifications and coding profiles prove your commitment to learning and excellence.
          </p>
        </div>
      </div>
    </OnboardingCard>
  );
}
