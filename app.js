
/* ========================================
   1. SUPABASE SETTINGS
   ======================================== */

const SUPABASE_URL = "https://supabase.com/dashboard/project/qaobgdkhnozcuckubara";
const SUPABASE_KEY = "sb_publishable_Wh5xOf8qi4Cj6GooVCEupQ_LTf0MUmm";


/* ========================================
   2. YOUR GOOGLE DRIVE VIDEOS

   প্রতিটি ভিডিওর ID ও নাম এখানে যোগ করবে।
   API দরকার নেই।
   ======================================== */

const VIDEOS = [
  {
    id: "13MCKVOWGnmy2zUXOF4bne7bLXFKKS8uZ",
    name: "My First Video"
  },
  {
    id: "PASTE_SECOND_VIDEO_ID_HERE",
    name: "My Second Video"
  },
  {
    id: "PASTE_THIRD_VIDEO_ID_HERE",
    name: "My Third Video"
  }
];


/* ========================================
   3. CONNECT TO SUPABASE
   ======================================== */

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const authSection = document.getElementById("authSection");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSubmit = document.getElementById("authSubmit");
const switchAuth = document.getElementById("switchAuth");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");
const feed = document.getElementById("feed");
const statusBox = document.getElementById("status");

let currentUser = null;
let signupMode = false;
let renderedVideos = false;


/* ========================================
   4. LOGIN AND SIGNUP
   ======================================== */

switchAuth.addEventListener("click", () => {
  signupMode = !signupMode;

  authTitle.textContent = signupMode
    ? "Create your account"
    : "Welcome!";

  authDescription.textContent = signupMode
    ? "Create an account to join your friends."
    : "Log in to watch videos with your friends.";

  authSubmit.textContent = signupMode
    ? "Sign up"
    : "Log in";

  switchAuth.textContent = signupMode
    ? "Already have an account? Log in"
    : "Create a new account";

  document.getElementById("password").autocomplete =
    signupMode ? "new-password" : "current-password";

  authMessage.textContent = "";
});


authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  authSubmit.disabled = true;
  authMessage.textContent = "Please wait...";

  try {
    let result;

    if (signupMode) {
      result = await client.auth.signUp({
        email,
        password
      });
    } else {
      result = await client.auth.signInWithPassword({
        email,
        password
      });
    }

    if (result.error) throw result.error;

    if (
      signupMode &&
      result.data.user &&
      !result.data.session
    ) {
      authMessage.textContent =
        "Account created. Check your email to confirm it, then log in.";
    } else {
      authMessage.textContent = "Success!";
    }

  } catch (error) {
    authMessage.textContent = error.message;
  } finally {
    authSubmit.disabled = false;
  }
});


logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;

  const { error } = await client.auth.signOut();

  logoutBtn.disabled = false;

  if (error) alert(error.message);
});


/* ========================================
   5. LOGIN STATE
   ======================================== */

function updateScreen(user) {
  currentUser = user;

  authSection.hidden = !!user;
  feed.hidden = !user;
  logoutBtn.hidden = !user;
  statusBox.hidden = !!user;

  if (!user) {
    feed.replaceChildren();
    renderedVideos = false;
    statusBox.textContent = "Please log in first.";
    return;
  }

  if (!renderedVideos) {
    renderedVideos = true;
    showVideos();
  }
}

client.auth.onAuthStateChange((_event, session) => {
  updateScreen(session?.user || null);
});


/* ========================================
   6. HELPER: MAKE HTML ELEMENTS
   ======================================== */

function makeElement(tag, className, text = "") {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text) element.textContent = text;

  return element;
}


/* ========================================
   7. LOAD THE VIDEO GALLERY
   ======================================== */

function showVideos() {
  feed.replaceChildren();

  const videos = VIDEOS.filter(video =>
    video.id &&
    !video.id.startsWith("PASTE_") &&
    video.name
  );

  if (!videos.length) {
    statusBox.hidden = false;
    statusBox.textContent =
      "Add your Google Drive video IDs in app.js first.";
    return;
  }

  statusBox.hidden = true;

  videos.forEach(video => {
    const reel = makeElement("section", "reel");

    const playerWrap = makeElement("div", "player-wrap");
    const player = document.createElement("iframe");

    player.src =
      "https://drive.google.com/file/d/" +
      encodeURIComponent(video.id) +
      "/preview";

    player.title = video.name;
    player.allow = "autoplay; fullscreen";
    player.allowFullscreen = true;
    player.loading = "lazy";

    playerWrap.appendChild(player);

    const info = makeElement("div", "video-info");
    const title = makeElement("h3", "video-title", video.name);

    const actions = makeElement("div", "actions");
    const likeButton = makeElement("button", "", "♡ Like");
    const likeCount = makeElement("span", "count", "Loading likes...");

    const commentHeading = makeElement(
      "h4", "comment-heading", "Comments"
    );

    const commentList = makeElement("div", "comment-list");

    const commentForm = document.createElement("form");
    commentForm.className = "comment-form";

    const commentInput = document.createElement("input");
    commentInput.className = "comment-input";
    commentInput.placeholder = "Write a comment...";
    commentInput.maxLength = 500;
    commentInput.required = true;
    commentInput.setAttribute("aria-label", "Write a comment");

    const sendButton = makeElement("button", "", "Send");
    sendButton.type = "submit";

    commentForm.append(commentInput, sendButton);
    actions.append(likeButton, likeCount);

    info.append(
      title,
      actions,
      commentHeading,
      commentList,
      commentForm
    );

    reel.append(playerWrap, info);
    feed.appendChild(reel);


    /* ====================================
       8. LOAD LIKES
       ==================================== */

    async function loadLikes() {
      const { data, error } = await client
        .from("likes")
        .select("user_id")
        .eq("video_id", video.id);

      if (error) {
        likeCount.textContent = "Likes unavailable";
        return;
      }

      const liked = data.some(
        item => item.user_id === currentUser?.id
      );

      likeButton.textContent = liked ? "♥ Liked" : "♡ Like";
      likeButton.classList.toggle("liked", liked);
      likeCount.textContent = data.length + " likes";
    }


    /* ====================================
       9. LIKE / UNLIKE BUTTON
       ==================================== */

    likeButton.addEventListener("click", async () => {
      if (!currentUser) return;

      likeButton.disabled = true;

      try {
        const { data, error } = await client
          .from("likes")
          .select("id")
          .eq("video_id", video.id)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const result = await client
            .from("likes")
            .delete()
            .eq("id", data.id);

          if (result.error) throw result.error;
        } else {
          const result = await client
            .from("likes")
            .insert({
              video_id: video.id,
              user_id: currentUser.id
            });

          if (result.error) throw result.error;
        }

        await loadLikes();

      } catch (error) {
        alert("Like error: " + error.message);
      } finally {
        likeButton.disabled = false;
      }
    });


    /* ====================================
       10. LOAD COMMENTS
       ==================================== */

    async function loadComments() {
      const { data, error } = await client
        .from("comments")
        .select("id,body,user_id,created_at")
        .eq("video_id", video.id)
        .order("created_at", { ascending: true });

      if (error) {
        commentList.textContent = "Comments unavailable.";
        return;
      }

      commentList.replaceChildren();

      if (!data.length) {
        commentList.textContent = "No comments yet.";
        return;
      }

      data.forEach(comment => {
        const line = makeElement("div", "comment-item");

        const author = makeElement(
          "strong",
          "",
          comment.user_id === currentUser?.id
            ? "You: "
            : "Friend: "
        );

        const body = makeElement("span", "", comment.body);

        line.append(author, body);
        commentList.appendChild(line);
      });
    }


    /* ====================================
       11. SEND A COMMENT
       ==================================== */

    commentForm.addEventListener("submit", async event => {
      event.preventDefault();

      if (!currentUser) return;

      const body = commentInput.value.trim();

      if (!body || body.length > 500) return;

      sendButton.disabled = true;

      try {
        const { error } = await client
          .from("comments")
          .insert({
            video_id: video.id,
            user_id: currentUser.id,
            body
          });

        if (error) throw error;

        commentInput.value = "";
        await loadComments();

      } catch (error) {
        alert("Comment error: " + error.message);
      } finally {
        sendButton.disabled = false;
      }
    });


    loadLikes();
    loadComments();
  });
}


/* ========================================
   12. RESTORE LOGIN SESSION
   ======================================== */

(async function restoreSession() {
  const { data, error } = await client.auth.getSession();

  if (error) {
    statusBox.hidden = false;
    statusBox.textContent = "Could not check login session.";
    return;
  }

  updateScreen(data.session?.user || null);
})();
