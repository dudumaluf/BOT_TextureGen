# Panel Interaction Standard Protocol

## Core Rule
**When ANY panel is open, ONLY the close button should be interactive.**

## Implementation Standard

### 1. Panel Detection
```javascript
const anyPanelOpen = isGalleryOpen || showQueuePanel || isSceneOpen || isBottomBarOpen || isPreviewOpen;
```

### 2. Button Interaction Logic
For ALL toggle buttons, apply this pattern:

```javascript
// Opacity: Hide when other panels are open, show when this panel is open or no panels are open
animate={{ 
  opacity: (anyPanelOpen && !thisButtonsPanelIsOpen) ? 0 : 1 
}}

// Pointer Events: Disable when invisible
className={`... ${(anyPanelOpen && !thisButtonsPanelIsOpen) ? 'pointer-events-none' : 'pointer-events-auto'} ...`}
```

### 3. Specific Button Rules

#### Gallery Toggle
- **Visible:** When no panels are open OR gallery is open
- **Hidden:** When any other panel is open
- **Interactive:** Only when visible

#### Scene Toggle  
- **Visible:** When no panels are open OR scene is open
- **Hidden:** When any other panel is open
- **Interactive:** Only when visible

#### Queue Toggle
- **Visible:** When no panels are open OR queue is open
- **Hidden:** When any other panel is open
- **Interactive:** Only when visible

#### Prompt Panel Toggle
- **Visible:** When no panels are open OR prompt panel is open
- **Hidden:** When any other panel is open
- **Interactive:** Only when visible

#### Asset Preview Toggle
- **Visible:** When no panels are open OR preview is open
- **Hidden:** When any other panel is open
- **Interactive:** Only when visible

#### Settings Toggle
- **Visible:** When no panels are open
- **Hidden:** When any panel is open
- **Interactive:** Only when visible

#### Logo
- **Visible:** When no panels are open
- **Hidden:** When any panel is open
- **Interactive:** Only when visible

#### Close Button (Mobile)
- **Always Visible:** When any panel is open
- **Always Interactive:** Highest z-index, never disabled
- **Position:** Same as prompt toggle for consistency

## Benefits

1. **No Accidental Clicks:** Invisible buttons cannot be triggered
2. **Clean Interface:** Only relevant controls are visible
3. **Mobile Friendly:** Prevents touch accidents on invisible areas
4. **Predictable UX:** Users can only interact with what they see
5. **Accessibility:** Screen readers won't focus on invisible elements

## Testing Checklist

- [ ] Open Gallery → All other toggles fade and become non-interactive
- [ ] Open Scene → All other toggles fade and become non-interactive  
- [ ] Open Queue → All other toggles fade and become non-interactive
- [ ] Open Prompt Panel → All other toggles fade and become non-interactive
- [ ] Open Asset Preview → All other toggles fade and become non-interactive
- [ ] Try clicking invisible button areas → No response
- [ ] Close button always works → Panel closes properly
- [ ] Mobile touch on invisible areas → No accidental triggers

## Code Pattern Template

```javascript
{/* Button Template */}
{!buttonPanelIsOpen && (
  <motion.button
    animate={{ 
      opacity: (anyPanelOpen && !buttonPanelIsOpen) ? 0 : 1 
    }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    onClick={handleButtonClick}
    className={`... ${(anyPanelOpen && !buttonPanelIsOpen) ? 'pointer-events-none' : 'pointer-events-auto'} ...`}
  >
    {/* Button Content */}
  </motion.button>
)}
```

This standard ensures a clean, predictable interface where only visible elements are interactive.
