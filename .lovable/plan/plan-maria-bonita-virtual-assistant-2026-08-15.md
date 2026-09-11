# Plan: Maria Bonita Virtual Assistant

Create a floating AI virtual assistant component named "Maria Bonita" with a Northeastern Brazilian persona to assist users on the Oxente marketplace.

## Visual Identity

- Floating chat widget in the **bottom-left** corner (consistent across all pages).
- Round avatar icon of Maria Bonita (stylized with a cangaço hat).
- Chat window header with "Maria Bonita - Assistente Oxente" and a green "Online" status.
- Welcoming message: "Oxente, olá! Como posso te ajudar hoje?"

## Functionality

- Chat interface with message bubbles, text input, and send button.
- AI persona: Helpful, welcoming, and uses regional Northeastern expressions.
- Automated responses for common topics:
  - Order tracking
  - Cashback levels (Bronze, Prata, Ouro)
  - Seller onboarding and management
- Quick action chips for FAQ:
  - "Onde está meu pedido?"
  - "Como funciona o cashback?"
  - "Como cadastrar minha loja?"
- Simulated instant responses for quick actions.

## Technical Implementation

- Create `src/components/maria-bonita-chat.tsx` using `shadcn/ui` (Button, Input, ScrollArea, Avatar, Card).
- Add `MariaBonitaChat` to `src/routes/__root.tsx`.
- Implement basic response logic (simulated for now, extensible to AI gateway).
- Style with brand colors (orange/brown) and animations.

## Technical Details

- **Component**: `MariaBonitaChat`
- **Location**: `src/components/maria-bonita-chat.tsx`
- **Integration**: Root route layout.
- **State Management**: Local state for chat history and open/closed visibility.
