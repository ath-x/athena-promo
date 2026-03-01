---
name: multi-agent-conductor
description: Multi-agent coordination for Gemini CLI. Supports one Lead Architect and multiple specialized Execution Agents.
---

# Multi-Agent Conductor (v1.9 - Multi-Agent ID)

This skill defines the protocol for a "Lead Architect" to coordinate multiple specialized "Execution Agents" across separate terminal sessions.

## 🚀 Initialization Protocol (MANDATORY)
Upon activation, the agent MUST establish its session-specific identity:
1. **Identify Session:** Get the current Session ID.
2. **Role Selection:** Ask the user: "Am I the Lead Architect or an Execution Agent for this session?"
3. **Identity (Execution Agents ONLY):** 
   - Ask the user for a unique ID (e.g., 'Debugger', 'Optimizer').
   - Create a session file: 'conductor/agents/[SESSION_ID].json' with the role and ID.
4. **Mirroring Setup:** 
   - Guide the user: `script -f conductor/terminal_live_[AGENT_ID].log`.
5. **Sync Engine:** Deploy 'scripts/sync.js' to 'conductor/sync.js'.

## 🛡️ Leadership Rules
- **One Leader:** Only ONE session can be the Lead Architect. 
- **No Overwriting:** An agent MUST NOT overwrite existing role files of other sessions.
- **Visual Cues:** 🛡️ [Lead Architect] or ⚙️ [Execution Agent: ID].

## 📡 Monitoring
- **Lead Architect:** Periodically 'tail' the specific log of the agent being monitored.
- **Execution Agents:** Ping the log using `node conductor/sync.js ping [ID]`.

## Safety Guardrails
- **Confict Resolution:** If two agents claim Leadership, the user must terminate one.
