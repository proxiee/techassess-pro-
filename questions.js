// ============================================================
// QUESTION BANK — Senior Full-Stack Developer Assessment
// ============================================================

const mcqQuestions = [
  // ── System Design & Architecture ──────────────────────────
  {
    id: 1,
    category: "System Design",
    question: "Which strategy best ensures high availability in a distributed microservices architecture when a downstream service becomes unresponsive?",
    options: [
      "Increasing the timeout value for HTTP requests",
      "Implementing a circuit breaker pattern with fallback mechanisms",
      "Retry the failed request indefinitely until it succeeds",
      "Deploying a larger instance for the downstream service"
    ],
    correct: 1,
    explanation: "The circuit breaker pattern prevents cascading failures by stopping requests to an unresponsive service and providing fallback responses."
  },
  {
    id: 2,
    category: "System Design",
    question: "In a CQRS (Command Query Responsibility Segregation) architecture, what is the primary benefit of separating read and write models?",
    options: [
      "It eliminates the need for a database",
      "It allows independent scaling and optimization of read and write workloads",
      "It makes the codebase smaller",
      "It removes the need for an API gateway"
    ],
    correct: 1,
    explanation: "CQRS allows you to scale reads and writes independently and optimize each model for its specific workload."
  },
  {
    id: 3,
    category: "System Design",
    question: "When implementing event sourcing, what is the recommended approach for rebuilding the current state of an entity?",
    options: [
      "Query the last snapshot directly from the events table",
      "Replay all events from the event store sequentially to reconstruct the state",
      "Store the current state alongside events and ignore past events",
      "Use a random sampling of events to approximate the state"
    ],
    correct: 1,
    explanation: "Event sourcing reconstructs state by replaying all events. Snapshots can be used as an optimization but the fundamental approach is event replay."
  },

  // ── Database & Data Modeling ──────────────────────────────
  {
    id: 4,
    category: "Database",
    question: "In PostgreSQL, what does the `EXPLAIN ANALYZE` command provide that `EXPLAIN` alone does not?",
    options: [
      "The estimated query plan only",
      "The actual execution time and row counts from running the query",
      "A visual diagram of the query plan",
      "Automatic index suggestions"
    ],
    correct: 1,
    explanation: "EXPLAIN ANALYZE actually executes the query and reports real execution times and row counts, unlike EXPLAIN which only estimates."
  },
  {
    id: 5,
    category: "Database",
    question: "Which isolation level in SQL databases can lead to phantom reads but prevents dirty reads and non-repeatable reads?",
    options: [
      "READ UNCOMMITTED",
      "READ COMMITTED",
      "REPEATABLE READ",
      "SERIALIZABLE"
    ],
    correct: 2,
    explanation: "REPEATABLE READ prevents dirty reads and non-repeatable reads but still allows phantom reads (new rows appearing in a range query)."
  },
  {
    id: 6,
    category: "Database",
    question: "In MongoDB, what is the primary purpose of the aggregation pipeline's `$lookup` stage?",
    options: [
      "To create a new collection",
      "To perform a left outer join with another collection",
      "To validate document schemas",
      "To create indexes on a collection"
    ],
    correct: 1,
    explanation: "$lookup performs a left outer join to another collection in the same database, similar to SQL JOINs."
  },
  {
    id: 7,
    category: "Database",
    question: "When designing a Redis caching strategy, which eviction policy removes the least recently used keys when memory limit is reached?",
    options: [
      "volatile-random",
      "allkeys-lru",
      "noeviction",
      "volatile-ttl"
    ],
    correct: 1,
    explanation: "allkeys-lru evicts the least recently used keys among all keys when the memory limit is reached."
  },

  // ── JavaScript / TypeScript ───────────────────────────────
  {
    id: 8,
    category: "JavaScript",
    question: "What is the output of the following code?\n\n```javascript\nconst obj = { a: 1, b: 2, c: 3 };\nconst { a, ...rest } = obj;\nconsole.log(rest);\n```",
    options: [
      "{ a: 1 }",
      "{ b: 2, c: 3 }",
      "{ a: 1, b: 2, c: 3 }",
      "undefined"
    ],
    correct: 1,
    explanation: "Object rest/spread destructuring assigns 'a' to the variable and collects the remaining properties into 'rest'."
  },
  {
    id: 9,
    category: "JavaScript",
    question: "In JavaScript, what does `Promise.allSettled()` return when given an array of promises where some reject?",
    options: [
      "A rejected promise with the first rejection reason",
      "An array of results with status 'fulfilled' or 'rejected' for each promise",
      "Only the fulfilled promise values",
      "An error object containing all rejection reasons"
    ],
    correct: 1,
    explanation: "Promise.allSettled() waits for all promises and returns an array of objects with status and value/reason for each."
  },
  {
    id: 10,
    category: "TypeScript",
    question: "In TypeScript, what does the `infer` keyword do within a conditional type?",
    options: [
      "It infers the return type of a function at runtime",
      "It declares a type variable within the extends clause of a conditional type",
      "It automatically generates type definitions from JavaScript files",
      "It infers the types of function parameters"
    ],
    correct: 1,
    explanation: "The 'infer' keyword allows you to declare a type variable within a conditional type's extends clause, enabling pattern matching on types."
  },
  {
    id: 11,
    category: "JavaScript",
    question: "What is the difference between `WeakMap` and `Map` in JavaScript?",
    options: [
      "WeakMap keys must be objects and are weakly referenced, allowing garbage collection",
      "WeakMap is faster than Map for all operations",
      "WeakMap can use primitive types as keys",
      "WeakMap maintains insertion order while Map does not"
    ],
    correct: 0,
    explanation: "WeakMap only accepts objects as keys and holds weak references, allowing keys to be garbage collected when no other references exist."
  },

  // ── React & Frontend Frameworks ───────────────────────────
  {
    id: 12,
    category: "React",
    question: "In React 18, what is the purpose of `useTransition` hook?",
    options: [
      "To animate component transitions",
      "To mark non-urgent state updates so they don't block urgent UI updates",
      "To manage CSS transitions",
      "To handle page navigation transitions"
    ],
    correct: 1,
    explanation: "useTransition lets you mark state updates as non-urgent, allowing React to keep the UI responsive during heavy re-renders."
  },
  {
    id: 13,
    category: "React",
    question: "What problem does React's `useMemo` hook solve, and when should it NOT be used?",
    options: [
      "It prevents all re-renders; it should not be used with context",
      "It memoizes expensive computations; it should not be used for cheap operations as it adds overhead",
      "It caches API responses; it should not be used with WebSockets",
      "It stores component state; it should not be used in class components"
    ],
    correct: 1,
    explanation: "useMemo caches expensive computation results. Using it for trivial operations adds unnecessary overhead from the memoization itself."
  },
  {
    id: 14,
    category: "Frontend",
    question: "Which technique is most effective for preventing Cumulative Layout Shift (CLS) when loading images on a webpage?",
    options: [
      "Using CSS display: none until images load",
      "Setting explicit width and height attributes or using aspect-ratio CSS",
      "Loading all images synchronously before rendering the page",
      "Using JavaScript to detect image load events"
    ],
    correct: 1,
    explanation: "Explicit dimensions or aspect-ratio reserves space in the layout before the image loads, preventing layout shifts."
  },

  // ── Node.js & Backend ─────────────────────────────────────
  {
    id: 15,
    category: "Node.js",
    question: "In Node.js, what is the event loop phase order?",
    options: [
      "poll → check → close → timers → pending",
      "timers → pending callbacks → idle/prepare → poll → check → close callbacks",
      "check → timers → poll → close → pending",
      "timers → poll → check → pending → close"
    ],
    correct: 1,
    explanation: "The Node.js event loop phases run in order: timers, pending callbacks, idle/prepare, poll, check, close callbacks."
  },
  {
    id: 16,
    category: "Node.js",
    question: "What is the primary purpose of Node.js Worker Threads?",
    options: [
      "To handle I/O operations more efficiently",
      "To run CPU-intensive JavaScript operations in parallel without blocking the main thread",
      "To create multiple HTTP servers on different ports",
      "To replace the cluster module entirely"
    ],
    correct: 1,
    explanation: "Worker Threads allow CPU-intensive JavaScript to run in parallel threads, unlike the cluster module which creates separate processes."
  },

  // ── API Design ────────────────────────────────────────────
  {
    id: 17,
    category: "API Design",
    question: "In GraphQL, what is the N+1 problem and how is it typically solved?",
    options: [
      "It's a versioning issue; solved by using schema stitching",
      "It occurs when resolving nested fields leads to excessive database queries; solved by using DataLoader for batching",
      "It's a pagination problem; solved by using cursor-based pagination",
      "It's a subscription issue; solved by using WebSockets"
    ],
    correct: 1,
    explanation: "The N+1 problem happens when resolving a list of items triggers individual queries for each item's related data. DataLoader batches these queries."
  },
  {
    id: 18,
    category: "API Design",
    question: "Which HTTP status code should a REST API return when a resource is successfully created?",
    options: [
      "200 OK",
      "201 Created",
      "204 No Content",
      "202 Accepted"
    ],
    correct: 1,
    explanation: "201 Created is the correct status code for successful resource creation, typically with a Location header pointing to the new resource."
  },

  // ── DevOps & CI/CD ────────────────────────────────────────
  {
    id: 19,
    category: "DevOps",
    question: "In a Kubernetes deployment, what is the difference between a `Deployment` and a `StatefulSet`?",
    options: [
      "Deployments are for frontend; StatefulSets are for backend",
      "StatefulSets provide stable network identities and persistent storage for stateful applications",
      "Deployments cannot be scaled; StatefulSets can",
      "There is no functional difference"
    ],
    correct: 1,
    explanation: "StatefulSets maintain stable, unique network identifiers and persistent storage across pod rescheduling, essential for stateful applications like databases."
  },
  {
    id: 20,
    category: "DevOps",
    question: "What is the purpose of a multi-stage Docker build?",
    options: [
      "To run multiple containers simultaneously",
      "To reduce final image size by separating build dependencies from runtime",
      "To deploy to multiple environments at once",
      "To enable Docker Compose functionality"
    ],
    correct: 1,
    explanation: "Multi-stage builds use separate stages for building and running, keeping build tools out of the final image and reducing its size significantly."
  },

  // ── Security ──────────────────────────────────────────────
  {
    id: 21,
    category: "Security",
    question: "What is the most effective defense against Cross-Site Request Forgery (CSRF) attacks?",
    options: [
      "Input validation on all form fields",
      "Synchronizer token pattern (CSRF tokens) combined with SameSite cookie attribute",
      "Using HTTPS exclusively",
      "Rate limiting API endpoints"
    ],
    correct: 1,
    explanation: "CSRF tokens ensure requests originate from your application. Combined with SameSite cookies, they provide robust CSRF protection."
  },
  {
    id: 22,
    category: "Security",
    question: "In JWT-based authentication, why is it considered a best practice to use short-lived access tokens with refresh tokens?",
    options: [
      "To reduce database storage requirements",
      "To limit the exposure window if a token is compromised while maintaining user session",
      "To improve token generation speed",
      "To eliminate the need for HTTPS"
    ],
    correct: 1,
    explanation: "Short-lived access tokens limit the window of vulnerability. Refresh tokens allow session continuity without keeping long-lived credentials client-side."
  },

  // ── Testing ───────────────────────────────────────────────
  {
    id: 23,
    category: "Testing",
    question: "What is the key difference between unit tests, integration tests, and end-to-end (E2E) tests in a testing pyramid?",
    options: [
      "They all test the same thing at different speeds",
      "Unit tests test isolated components, integration tests test component interactions, E2E tests test complete user workflows",
      "Unit tests are automated, integration tests are manual, E2E tests are optional",
      "The only difference is the programming language used"
    ],
    correct: 1,
    explanation: "The testing pyramid defines scope: unit tests for isolated logic, integration tests for component interactions, and E2E tests for complete user journeys."
  },
  {
    id: 24,
    category: "Testing",
    question: "When writing tests, what does the 'Arrange-Act-Assert' pattern refer to?",
    options: [
      "The three environments where tests should run",
      "Setting up test data, executing the code under test, then verifying the expected outcome",
      "The order of test files in a project structure",
      "Three different types of assertions available in testing frameworks"
    ],
    correct: 1,
    explanation: "Arrange-Act-Assert is a pattern: Arrange (setup), Act (execute), Assert (verify) — making tests readable and consistent."
  },

  // ── Performance & Optimization ────────────────────────────
  {
    id: 25,
    category: "Performance",
    question: "What is tree-shaking in the context of JavaScript bundlers like Webpack or Rollup?",
    options: [
      "A technique to randomize code for obfuscation",
      "Dead code elimination that removes unused exports from the final bundle",
      "A method to reorganize the DOM tree for faster rendering",
      "A caching strategy for frequently accessed modules"
    ],
    correct: 1,
    explanation: "Tree-shaking analyzes import/export statements to remove unused code from the final bundle, reducing bundle size."
  },
  {
    id: 26,
    category: "Performance",
    question: "Which caching header combination provides the best strategy for static assets that change with each deployment?",
    options: [
      "Cache-Control: no-cache, no-store",
      "Cache-Control: public, max-age=31536000, immutable — with content-hashed filenames",
      "Cache-Control: private, max-age=3600",
      "Expires: Thu, 01 Jan 2099 00:00:00 GMT"
    ],
    correct: 1,
    explanation: "Content-hashed filenames change on deployment, allowing aggressive caching (1 year + immutable) since the URL itself changes."
  },

  // ── Networking & Protocols ────────────────────────────────
  {
    id: 27,
    category: "Networking",
    question: "What is the key improvement of HTTP/2 over HTTP/1.1?",
    options: [
      "HTTP/2 uses UDP instead of TCP",
      "HTTP/2 supports multiplexing multiple requests over a single TCP connection",
      "HTTP/2 eliminates the need for TLS",
      "HTTP/2 uses XML instead of text-based headers"
    ],
    correct: 1,
    explanation: "HTTP/2 multiplexes multiple streams over a single TCP connection, eliminating head-of-line blocking at the HTTP level."
  },
  {
    id: 28,
    category: "Networking",
    question: "When would you choose WebSockets over Server-Sent Events (SSE)?",
    options: [
      "When you only need server-to-client communication",
      "When you need full-duplex, bidirectional communication between client and server",
      "When you need better browser support",
      "When you need automatic reconnection"
    ],
    correct: 1,
    explanation: "WebSockets provide full-duplex communication. SSE is simpler but only supports server-to-client. Choose WebSockets when bidirectional communication is needed."
  },

  // ── Cloud & Infrastructure ────────────────────────────────
  {
    id: 29,
    category: "Cloud",
    question: "What is the CAP theorem and what does it state about distributed systems?",
    options: [
      "A system can achieve Caching, Authentication, and Performance simultaneously",
      "A distributed system can only guarantee two of three: Consistency, Availability, and Partition Tolerance",
      "Cloud services are Always Performant when Cached",
      "Containers Always Persist data across restarts"
    ],
    correct: 1,
    explanation: "The CAP theorem states that in a distributed system, you can only guarantee two out of three: Consistency, Availability, and Partition Tolerance."
  },
  {
    id: 30,
    category: "Cloud",
    question: "In a serverless architecture using AWS Lambda, what is a 'cold start' and how can it be mitigated?",
    options: [
      "A security vulnerability; mitigated by using VPNs",
      "The initialization delay when a new Lambda instance is created; mitigated by provisioned concurrency or keeping functions warm",
      "A database connection timeout; mitigated by connection pooling",
      "A CDN cache miss; mitigated by pre-warming the cache"
    ],
    correct: 1,
    explanation: "Cold starts occur when Lambda creates a new execution environment. Provisioned concurrency keeps instances warm, reducing latency."
  }
];

const programmingQuestions = [
  {
    id: 31,
    category: "Programming Challenge",
    title: "Implement a Rate Limiter",
    question: `Implement a \`RateLimiter\` class in JavaScript that uses the **sliding window** algorithm.

**Requirements:**
- Constructor takes \`maxRequests\` (number) and \`windowMs\` (time window in milliseconds)
- Method \`allowRequest(clientId)\` returns \`true\` if the request is allowed, \`false\` otherwise
- Each client should be tracked independently
- Expired timestamps should be cleaned up

**Example Usage:**
\`\`\`javascript
const limiter = new RateLimiter(3, 1000); // 3 requests per second
limiter.allowRequest("user1"); // true
limiter.allowRequest("user1"); // true
limiter.allowRequest("user1"); // true
limiter.allowRequest("user1"); // false (limit reached)
\`\`\`

Write your implementation below:`,
    starterCode: `class RateLimiter {
  constructor(maxRequests, windowMs) {
    // Your implementation here
  }

  allowRequest(clientId) {
    // Your implementation here
  }
}

// Test your implementation
const limiter = new RateLimiter(3, 1000);
console.log(limiter.allowRequest("user1")); // true
console.log(limiter.allowRequest("user1")); // true
console.log(limiter.allowRequest("user1")); // true
console.log(limiter.allowRequest("user1")); // false`,
    testCases: [
      "Creates a RateLimiter instance with correct parameters",
      "Allows requests within the limit",
      "Blocks requests exceeding the limit",
      "Tracks multiple clients independently",
      "Cleans up expired timestamps"
    ]
  },
  {
    id: 32,
    category: "Programming Challenge",
    title: "Build a Deep Object Diff Utility",
    question: `Implement a \`deepDiff\` function that compares two objects and returns the differences.

**Requirements:**
- Compare two objects recursively
- Return an object describing changes: \`added\`, \`removed\`, \`changed\` (with \`from\` and \`to\` values)
- Handle nested objects
- Handle arrays (compare by index)

**Example:**
\`\`\`javascript
const oldObj = { name: "Alice", age: 30, address: { city: "NYC" } };
const newObj = { name: "Alice", age: 31, address: { city: "LA" }, role: "admin" };

deepDiff(oldObj, newObj);
// Returns:
// {
//   age: { type: "changed", from: 30, to: 31 },
//   address: {
//     city: { type: "changed", from: "NYC", to: "LA" }
//   },
//   role: { type: "added", value: "admin" }
// }
\`\`\`

Write your implementation below:`,
    starterCode: `function deepDiff(oldObj, newObj) {
  // Your implementation here
}

// Test your implementation
const oldObj = {
  name: "Alice",
  age: 30,
  address: { city: "NYC", zip: "10001" },
  tags: ["dev", "admin"]
};

const newObj = {
  name: "Alice",
  age: 31,
  address: { city: "LA" },
  role: "lead",
  tags: ["dev", "manager"]
};

console.log(JSON.stringify(deepDiff(oldObj, newObj), null, 2));`,
    testCases: [
      "Detects changed primitive values",
      "Detects added keys",
      "Detects removed keys",
      "Handles nested object comparison",
      "Handles array comparison by index"
    ]
  }
];

// Export for use in app.js
if (typeof module !== 'undefined') {
  module.exports = { mcqQuestions, programmingQuestions };
}
