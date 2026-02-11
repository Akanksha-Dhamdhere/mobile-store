import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedInUser } from "../utils/authUtils";
import AuthModal from "../components/AuthModal";

export default function Help() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", sender: "bot" },
    { text: "You can ask me about product details, order status and offers...", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  const quickActions = [
    { label: "Track Order", response: "To track your order, go to profile." },
    { label: "Browse Products", response: "Use the Products page to browse the latest items." },
    { label: "Reviews", response: "You can view user reviews under the 'Reviews' tab." },
    { label: "Home", response: "Redirecting you to the Home page." },
    { label: "Help", response: "You can email us at help@mobileshopy.com" }
  ];

  const faqs = [
    "How do I track my order?",
    "How can I avail discounts and offers?",
    "Can I pre-order new devices?",
    "How can I contact customer support?"
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);

    // Improved keyword-based responder
    const getResponse = (text) => {
      const t = (text || '').toLowerCase().trim();
      
      // Track Order / Order Status
      if (t.includes('track') || t.includes('order status') || t.includes('where') || t.includes('my order') || t.includes('order tracking')) {
        const user = getLoggedInUser();
        if (!user || !user.email) return { text: 'Please log in to track your orders. Let me help you log in.', sender: 'bot', action: 'auth' };
        return { text: 'You can track your orders on your Profile page. I\'ll redirect you there now.', sender: 'bot', action: 'navigate', to: '/profile' };
      }

      // Discounts, Offers, Coupons
      if (t.includes('discount') || t.includes('offer') || t.includes('coupon') || t.includes('sale') || t.includes('promo') || t.includes('deal')) {
        return { text: 'We have active offers on products. Check our Products page and homepage for current discounts and special deals.', sender: 'bot', action: 'navigate', to: '/products' };
      }

      // Pre-order questions
      if (t.includes('pre-order') || t.includes('pre order') || t.includes('preorder') || t.includes('upcoming')) {
        return { text: 'Pre-orders are available for selected new devices. Look for the "Pre-order" badge on product pages, or contact support for details.', sender: 'bot' };
      }

      // Contact & Support
      if (t.includes('contact') || t.includes('support') || t.includes('help') || t.includes('reach') || t.includes('talk to') || t.includes('email')) {
        return { text: 'Contact our support team at help@mobileshopy.com. You can also find our contact details in the footer.', sender: 'bot' };
      }

      // Products, Specs, Details, Price
      if (t.includes('price') || t.includes('spec') || t.includes('product') || t.includes('details') || t.includes('cost') || t.includes('how much')) {
        return { text: 'Browse our complete product catalog to view prices, specifications, and detailed information about all our devices.', sender: 'bot', action: 'navigate', to: '/products' };
      }

      // Payment & Checkout
      if (t.includes('payment') || t.includes('checkout') || t.includes('pay') || t.includes('card') || t.includes('UPI') || t.includes('refund')) {
        return { text: 'We accept multiple payment methods including cards, UPI, and online transfers. For refund queries, contact support at help@mobileshopy.com.', sender: 'bot' };
      }

      // Delivery & Shipping
      if (t.includes('delivery') || t.includes('ship') || t.includes('when')) {
        return { text: 'Delivery times depend on your location. Check your order details on the Profile page for estimated delivery. Contact support for specific queries.', sender: 'bot', action: 'navigate', to: '/profile' };
      }

      // Account & Login
      if (t.includes('login') || t.includes('password') || t.includes('account') || t.includes('sign up') || t.includes('reset')) {
        return { text: 'You can log in using your email and password. Use "Forgot Password" if you need to reset it. Contact support if you have issues.', sender: 'bot' };
      }

      // Reviews & Ratings
      if (t.includes('review') || t.includes('rate') || t.includes('rating')) {
        return { text: 'You can browse user reviews on product pages or submit your own review after purchase.', sender: 'bot' };
      }

      // Availability & Stock
      if (t.includes('available') || t.includes('stock') || t.includes('in stock') || t.includes('out of stock')) {
        return { text: 'Check product availability on the Products page. Contact support if an item is out of stock and you want to pre-order.', sender: 'bot', action: 'navigate', to: '/products' };
      }

      // Return & Warranty
      if (t.includes('return') || t.includes('exchange') || t.includes('warranty') || t.includes('defect')) {
        return { text: 'For return, exchange, or warranty issues, please contact our support team at help@mobileshopy.com with your order details.', sender: 'bot' };
      }

      // General Help
      if (t.includes('help') || t === 'hi' || t === 'hello' || t === 'hey' || t === '?') {
        return { text: 'Welcome! I can help you with: tracking orders, finding products, offers, payments, delivery, and customer support.', sender: 'bot' };
      }

      // Fallback with specific suggestions
      return {
        text: "I'm not sure about that. Here are things I can help with:",
        sender: 'bot',
        suggestions: [
          'Track Order',
          'Browse Products',
          'View Offers',
          'Contact Support'
        ]
      };
    };

    const resp = getResponse(input);
    setTimeout(() => {
      setMessages((prev) => [...prev, resp]);
      if (resp.action === 'navigate' && resp.to) {
        navigate(resp.to);
      }
      if (resp.action === 'auth') {
        setShowAuthModal(true);
      }
    }, 400);

    setInput("");
  };

  const handleQuickAction = (response, label) => {
    switch (label) {
      case "Home":
        navigate("/");
        break;
      case "Track Order": {
        const user = getLoggedInUser();
        if (!user || !user.email) {
          setShowAuthModal(true);
          setMessages((prev) => [
            ...prev,
            { text: "Please log in to track your order.", sender: "bot" }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { text: response, sender: "bot" }
          ]);
          navigate("/profile");
        }
        break;
      }
      case "Browse Products":
        setMessages((prev) => [
          ...prev,
          { text: response, sender: "bot" }
        ]);
        navigate("/products");
        break;
      case "Reviews":
        setMessages((prev) => [
          ...prev,
          { text: response, sender: "bot" }
        ]);
        navigate("/review");
        break;
      case "Help":
        setMessages((prev) => [
          ...prev,
          { text: response, sender: "bot" }
        ]);
        navigate("/help");
        break;
      default:
        setMessages((prev) => [
          ...prev,
          { text: response, sender: "bot" }
        ]);
    }
  };

  const handleSuggestion = (label) => {
    const qa = quickActions.find(q => q.label === label);
    if (qa) {
      handleQuickAction(qa.response, qa.label);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: `You selected: ${label}`, sender: 'bot' }
      ]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 font-sans">
      {/* Chat Section */}
      <div className="flex flex-col flex-1 h-[80vh] border border-gray-300 rounded-xl p-4 bg-white">
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`max-w-[70%] px-4 py-3 rounded-xl text-sm ${msg.sender === "user" ? "self-end bg-blue-100" : "self-start bg-blue-50"}`}>
              <div>{msg.text}</div>
              {msg.suggestions && Array.isArray(msg.suggestions) && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(sug)}
                      className="text-xs bg-gray-200 px-2 py-1 rounded-full"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex mt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your Feedback!!!"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm"
          />
          <button
            onClick={handleSend}
            className="ml-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="flex-2 w-full md:w-[40%] h-[80vh] overflow-y-auto border border-gray-300 rounded-xl p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

        <div className="flex flex-col items-center gap-4 mb-6">
          {/* Row 1 */}
          <div className="flex gap-4 flex-wrap justify-center">
            {quickActions && quickActions.length > 0 && (
              <button
                onClick={() => handleQuickAction(quickActions[0]?.response, quickActions[0]?.label)}
                className="bg-blue-700 text-white px-4 py-2 rounded-full text-sm min-w-[130px]"
              >
                {quickActions[0]?.label}
              </button>
            )}
            {quickActions && quickActions.length > 1 && (
              <button
                onClick={() => handleQuickAction(quickActions[1]?.response, quickActions[1]?.label)}
                className="bg-blue-700 text-white px-4 py-2 rounded-full text-sm min-w-[130px]"
              >
                {quickActions[1]?.label}
              </button>
            )}
          </div>

          {/* Center */}
          <div className="flex justify-center">
            {quickActions && quickActions.length > 4 && (
              <button
                onClick={() => handleQuickAction(quickActions[4]?.response, quickActions[4]?.label)}
                className="bg-blue-700 text-white px-4 py-2 rounded-full text-sm min-w-[130px]"
              >
                {quickActions[4]?.label}
              </button>
            )}
          </div>

          {/* Row 2 */}
          <div className="flex gap-4 flex-wrap justify-center">
            {quickActions && quickActions.length > 2 && (
              <button
                onClick={() => handleQuickAction(quickActions[2]?.response, quickActions[2]?.label)}
                className="bg-blue-700 text-white px-4 py-2 rounded-full text-sm min-w-[130px]"
              >
                {quickActions[2]?.label}
              </button>
            )}
            {quickActions && quickActions.length > 3 && (
              <button
                onClick={() => handleQuickAction(quickActions[3]?.response, quickActions[3]?.label)}
                className="bg-blue-700 text-white px-4 py-2 rounded-full text-sm min-w-[130px]"
              >
                {quickActions[3]?.label}
              </button>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-3">Frequently Asked Questions</h3>
        <div className="pl-2 space-y-2 text-sm text-gray-700">
          {faqs.map((faq, i) => (
            <h4 key={i}>{faq}</h4>
          ))}
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          setUser={() => setShowAuthModal(false)}
          reason="order"
        />
      )}
    </div>
  );
}

    