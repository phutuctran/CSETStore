<script lang="ts">
  import { themeStore } from '../stores/themeStore.svelte';

  // Extract clean Facebook Page ID from configuration (numeric ID or Page Username)
  let pageId = $derived.by(() => {
    const raw = (themeStore.theme.socials?.messengerPageId || '').trim();
    if (!raw || raw === 'https://m.me' || raw === 'https://m.me/' || raw === 'http://m.me') {
      return '106148332115160'; // Valid default Fanpage ID
    }
    const match = raw.match(/(?:facebook\.com\/|m\.me\/)?([a-zA-Z0-9.]+)\/?$/);
    return match && match[1] !== 'm.me' ? match[1] : '106148332115160';
  });

  $effect(() => {
    if (typeof window === 'undefined') return;

    // Configure the official Meta Customer Chatbox element
    const chatbox = document.getElementById('fb-customer-chat');
    if (chatbox) {
      chatbox.setAttribute('page_id', pageId);
      chatbox.setAttribute('attribution', 'biz_inbox');
      chatbox.setAttribute('alignment', 'left'); // Position at bottom-left corner
      chatbox.setAttribute('greeting_dialog_display', 'fade');
      if (themeStore.theme.primaryColor) {
        chatbox.setAttribute('theme_color', themeStore.theme.primaryColor);
      }
    }

    // Initialize official Facebook SDK
    const win = window as unknown as {
      fbAsyncInit?: () => void;
      FB?: {
        init: (options: { xfbml: boolean; version: string }) => void;
        XFBML?: { parse: () => void };
      };
    };

    win.fbAsyncInit = function() {
      if (win.FB) {
        win.FB.init({
          xfbml: true,
          version: 'v21.0'
        });
      }
    };

    // Load official Meta SDK script
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/vi_VN/sdk/xfbml.customerchat.js';
      document.body.appendChild(js);
    } else if (win.FB && typeof win.FB.XFBML?.parse === 'function') {
      // Re-parse XFBML if SDK is already loaded
      win.FB.XFBML.parse();
    }
  });
</script>

<!-- Official Meta Facebook Messenger Customer Chat Plugin Elements -->
<div id="fb-root"></div>
<div id="fb-customer-chat" class="fb-customerchat"></div>
