// DRE MVP Prototype - Plain JS SPA with hash routing and mock data
// Now using a separate JSON file for user data for easier management

// Router
const routeRegistry = {};
function registerRoute(path, renderFn) { routeRegistry[path] = renderFn; }
function navigate(path) { window.location.hash = `#${path}`; }
function getPath() { return window.location.hash.replace(/^#/, '') || 'login'; }

// App bootstrap
const app = document.getElementById('app');

// Global state
let state = {
  user: null, // {id, role: 'admin'|'mentor'|'student', email, name}
  files: {}, // temporary uploads keyed by token
  credits: {
    admin: { totalGranted: 1200 },
    mentor: { balance: 200 },
    student: { balance: 120 }
  },
  mock: {
    users: [], // Will be loaded from users.json
    agenda: JSON.parse(localStorage.getItem('agenda')) || [
      { id: 'ag1', date: '2025-09-12', title: 'Kickoff', time: '10:00', room: 'Main', status: 'Scheduled' },
      { id: 'ag2', date: '2025-09-13', title: 'Mentor Sync', time: '14:00', room: 'A2', status: 'Scheduled' },
    ],
    challenges: JSON.parse(localStorage.getItem('challenges')) || [
      { id: 'c1', title: 'Responsive Landing', description: 'Design and code a responsive landing page.', credits: 50, deadline: '2025-09-10' },
      { id: 'c2', title: 'Auth Microservice', description: 'Build a secure authentication microservice.', credits: 80, deadline: '2025-09-22' },
    ],
    assignments: JSON.parse(localStorage.getItem('assignments')) || [
      { id: 'a1', title: 'Week 1: HTML/CSS', description: 'Complete the HTML and CSS exercises.', mentor: 'Mentor User', deadline: '2025-09-18', credits: 50 },
      { id: 'a2', title: 'Week 2: JS Basics', description: 'Solve basic JavaScript problems.', mentor: 'Mentor User', deadline: '2025-09-25', credits: 75 },
    ],
    submissions: JSON.parse(localStorage.getItem('submissions')) || [
      { 
        id: 's1', team: 'Team Alpha', assignment: 'Week 1: HTML/CSS', challenge: 'Responsive Landing', by: 'Alice', at: '2025-09-01 12:00 PM', status: 'Submitted', grade: null, files: [
          { name: 'index.html', size: '2.5KB' },
          { name: 'styles.css', size: '1.2KB' }
        ]
      },
      { 
        id: 's2', team: 'Team Beta', assignment: 'Week 2: JS Basics', challenge: 'Auth Microservice', by: 'Bob', at: '2025-09-02 10:00 AM', status: 'Pending', grade: null, files: [
          { name: 'main.js', size: '5.8KB' },
          { name: 'server.js', size: '3.1KB' },
        ]
      },
      { 
        id: 's3', team: 'Team Gamma', assignment: 'Week 1: HTML/CSS', challenge: 'Database Design', by: 'Charlie', at: '2025-09-03 09:15 AM', status: 'Submitted', grade: null, files: [
          { name: 'schema.sql', size: '0.9KB' },
        ]
      },
    ],
    redeems: JSON.parse(localStorage.getItem('redeems')) || [],
  }
};

// --- Data loading function ---
async function loadData() {
  try {
    const response = await fetch('users.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    state.mock.users = await response.json();
  } catch (e) {
    console.error('Failed to load users.json:', e);
    state.mock.users = [
      { id: 'admin-01', role: 'admin', email: 'admin@example.com', password: 'password', name: 'Admin User' },
      { id: 'mentor-01', role: 'mentor', email: 'mentor@example.com', password: 'password', name: 'Mentor User' },
      { id: 'student-01', role: 'student', email: 'student@example.com', password: 'password', name: 'Student User' },
    ];
  }
}

// --- Utility Functions ---
function h(tag, props, children) {
  const element = document.createElement(tag);
  for (const key in props) {
    if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), props[key]);
    } else {
      element.setAttribute(key, props[key]);
    }
  }
  if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child) {
        element.appendChild(child);
      }
    });
  } else if (typeof children === 'string' || typeof children === 'number') {
    element.appendChild(document.createTextNode(children));
  }
  return element;
}

// Simple modal
let currentModal = null;
function showModal(content) {
  const backdrop = h('div', { class: 'modal-backdrop' }, [
    h('div', { class: 'modal' }, [content])
  ]);
  document.body.appendChild(backdrop);
  setTimeout(() => backdrop.classList.add('show'), 10);
  currentModal = backdrop;
}
function hideModal() {
  if (currentModal) {
    currentModal.classList.remove('show');
    setTimeout(() => {
      if (currentModal && currentModal.parentNode) {
        currentModal.parentNode.removeChild(currentModal);
      }
      currentModal = null;
    }, 300);
  }
}

// --- Views/Pages ---
function layout(title, actions, content) {
  const nav = h('div', { class: 'nav' }, [
    h('div', { class: 'brand' }, [
      h('img', { 
        src: 'visionary-logo.png', 
        alt: 'Visionary Logo', 
        style: 'height: 40px;'
      }),
      h('div', {}, [
        'VISIONARY ',
        h('small', {}, title ? ` / ${title}` : '')
      ])
    ]),
    h('div', { class: 'nav-actions' }, actions || [])
  ]);
  const container = h('div', { class: 'container' }, [nav, content]);
  app.innerHTML = '';
  app.appendChild(container);
}

// Student Dashboard View
function renderStudentDashboard() {
  let navActions = [
    h('button', { class: 'btn ghost', onclick: logout }, 'Log out')
  ];

  const kpis = h('div', { class: 'kpis' }, [
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'My Credits'),
      h('p', {}, `Ξ ${state.credits.student.balance}`)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Assignments Left'),
      h('p', {}, state.mock.assignments.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Challenges Left'),
      h('p', {}, state.mock.challenges.length)
    ]),
  ]);

  const assignmentsList = h('div', { class: 'list' }, state.mock.assignments.map(a =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, a.title),
        h('div', { class: 'meta' }, `By: ${a.mentor} | Deadline: ${a.deadline}`)
      ]),
      h('div', { class: 'pill info' }, `+${a.credits} Credits`),
    ])
  ));

  const challengesList = h('div', { class: 'list' }, state.mock.challenges.map(c =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, c.title),
        h('div', { class: 'meta' }, `Deadline: ${c.deadline}`)
      ]),
      h('div', { class: 'pill info' }, `+${c.credits} Credits`),
    ])
  ));

  const redeem = () => {
    showModal(h('div', {}, [
      h('h2', {}, 'Redeem Credits'),
      h('p', {}, 'This is a demo function. In a real app, this would process a redemption.'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
    ]));
  };

  const redeemHistory = state.mock.redeems.map(r => 
    h('tr', {}, [
      h('td', {}, r.id),
      h('td', {}, r.item),
      h('td', {}, r.date)
    ])
  );

  const historyTable = h('table', { class: 'table' }, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', {}, 'ID'),
        h('th', {}, 'Item'),
        h('th', {}, 'Date')
      ])
    ]),
    h('tbody', {}, redeemHistory)
  ]);

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, `Hello, ${state.user.name}!`),
        h('div', { class: 'muted' }, 'Your DRE Dashboard')
      ])
    ]),
    h('div', { class: 'spacer-lg' }),
    kpis,
    h('div', { class: 'spacer-lg' }),
    h('div', { class: 'grid' }, [
      h('div', { class: 'card' }, [
        h('h2', {}, 'Assignments'),
        h('div', { class: 'muted' }, 'Tasks assigned by mentors'),
        h('div', { class: 'spacer' }),
        h('div', { class: 'card-content-scroll' }, assignmentsList)
      ]),
      h('div', { class: 'card' }, [
        h('h2', {}, 'Challenges'),
        h('div', { class: 'muted' }, 'Team-based challenges'),
        h('div', { class: 'spacer' }),
        h('div', { class: 'card-content-scroll' }, challengesList)
      ]),
      h('div', { class: 'card' }, [
        h('h2', {}, 'Redeem Credits'),
        h('div', { class: 'muted' }, 'Redeem your credits for rewards.'),
        h('div', { class: 'spacer' }),
        h('div', { class: 'row' }, [
          h('div', { style: 'flex: 1;' }, [
            h('label', {}, 'Choose Item'),
            h('select', { class: 'input' }, [
              h('option', { value: '' }, 'Select a reward...'),
              h('option', { value: 'coffee' }, 'Coffee (10 Credits)'),
              h('option', { value: 'ticket' }, 'Movie Ticket (50 Credits)')
            ])
          ]),
          h('div', { style: 'display: flex; align-items: flex-end;' }, [
            h('button', { class: 'btn ok', onclick: redeem }, 'Redeem')
          ])
        ]),
        h('div', { class: 'spacer-lg' }),
        h('h3', {}, 'History'),
        h('div', { class: 'spacer' }),
        historyTable
      ]),
    ])
  ]);

  layout('Student Dashboard', navActions, content);
}

// Mentor Dashboard View
function renderMentorDashboard() {
  let navActions = [
    h('button', { class: 'btn ghost', onclick: logout }, 'Log out')
  ];

  const submissionsList = h('div', { class: 'list' }, state.mock.submissions.map(s =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, s.team),
        h('div', { class: 'meta' }, `Challenge: ${s.challenge} | Submitted by: ${s.by}`)
      ]),
      h('button', { class: 'btn info' }, `View File`),
    ])
  ));

  const redeem = () => {
    showModal(h('div', {}, [
      h('h2', {}, 'Redeem Credits'),
      h('p', {}, 'This is a demo function. In a real app, this would process a redemption.'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
    ]));
  };

  const grantCredit = () => {
    showModal(h('div', {}, [
      h('h2', {}, 'Grant Credits'),
      h('p', {}, 'This is a demo function. In a real app, this would grant credits to a user.'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
    ]));
  };

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, `Hello, Mentor ${state.user.name}!`),
        h('div', { class: 'muted' }, 'Review pending submissions')
      ])
    ]),
    h('div', { class: 'spacer-lg' }),
    h('div', { class: 'grid' }, [
      h('div', { class: 'card' }, [
        h('h2', {}, 'Submissions to Review'),
        h('div', { class: 'muted' }, 'List of all submitted challenges'),
        h('div', { class: 'spacer' }),
        h('div', { class: 'card-content-scroll' }, submissionsList)
      ]),
      h('div', { class: 'card' }, [
        h('h2', {}, 'Credits to Grant'),
        h('div', { class: 'muted' }, 'Grant credits to team members for their work.'),
        h('div', { class: 'spacer' }),
        h('div', { class: 'field' }, [
          h('label', {}, 'Select Team Member'),
          h('select', { class: 'input' }, [
            h('option', {}, 'Team Alpha - Alice'),
            h('option', {}, 'Team Beta - Bob')
          ])
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Credits Amount'),
          h('input', { type: 'number', class: 'input', placeholder: 'e.g., 50', value: '50' })
        ]),
        h('div', { class: 'row right' }, [
          h('button', { class: 'btn ok', onclick: grantCredit }, 'Confirm Grant')
        ]),
        h('div', { class: 'spacer-lg' }),
        h('h3', {}, 'My Balance'),
        h('div', { class: 'muted' }, 'You can redeem your credits for rewards.'),
        h('div', { class: 'spacer' }),
        h('p', {}, `Ξ ${state.credits.mentor.balance}`),
        h('div', { class: 'row right' }, [
          h('button', { class: 'btn primary', onclick: redeem }, 'Redeem')
        ])
      ])
    ])
  ]);

  layout('Mentor Dashboard', navActions, content);
}

// Admin Dashboard View
function renderAdminDashboard() {
  let navActions = [
    h('button', { class: 'btn ghost', onclick: logout }, 'Log out')
  ];
  const kpis = h('div', { class: 'kpis' }, [
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Agenda Items'),
      h('p', {}, state.mock.agenda.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Submissions'),
      h('p', {}, state.mock.submissions.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Assignments'),
      h('p', {}, state.mock.assignments.length)
    ]),
    h('div', { class: 'kpi' }, [
      h('h3', {}, 'Credits'),
      h('p', {}, `Ξ ${state.credits.admin.totalGranted}`)
    ]),
  ]);
  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, `Hello, Admin ${state.user.name}!`),
        h('div', { class: 'muted' }, 'Your DRE Admin Dashboard')
      ])
    ]),
    h('div', { class: 'spacer-lg' }),
    kpis,
    h('div', { class: 'spacer-lg' }),
    h('div', { class: 'grid' }, [
      h('div', { class: 'card home-card', onclick: () => navigate('agenda') }, [
        h('h2', {}, 'Agenda'),
        h('div', { class: 'muted' }, 'View program agenda'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('challenges/manage') }, [
        h('h2', {}, 'Challenges'),
        h('div', { class: 'muted' }, 'Create, edit and manage challenges'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('assignments/manage') }, [
        h('h2', {}, 'Manage Assignments'),
        h('div', { class: 'muted' }, 'Create and edit assignments'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
      h('div', { class: 'card home-card', onclick: () => navigate('credits/give') }, [
        h('h2', {}, 'Give Credits'),
        h('div', { class: 'muted' }, 'Grant credits to users'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary' }, 'Open')
      ]),
    ]),
  ]);
  layout('Admin Dashboard', navActions, content);
}

// Home page router that directs users to the correct dashboard based on their role
function renderHomePage() {
  if (!state.user) {
    navigate('login');
    return;
  }

  switch (state.user.role) {
    case 'admin':
      renderAdminDashboard();
      break;
    case 'mentor':
      renderMentorDashboard();
      break;
    case 'student':
      renderStudentDashboard();
      break;
    default:
      navigate('login');
  }
}

// --- New Admin Views ---
function renderAdminAgenda() {
  let navActions = [
    h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back'),
    h('button', { class: 'btn primary', onclick: () => showModal(h('div', {}, 'Create New Agenda Item Form')) }, 'New Agenda')
  ];
  
  const agendaList = h('div', { class: 'list' }, state.mock.agenda.map(item =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, `${item.title} • ${item.time}`),
        h('div', { class: 'meta' }, `${item.date} • ${item.room}`)
      ]),
      h('div', { class: 'pill ok' }, item.status)
    ])
  ));

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, 'Agenda'),
      ])
    ]),
    h('div', { class: 'spacer' }),
    agendaList
  ]);
  layout('Agenda', navActions, content);
}

// --- Challenges Functions ---
function renderManageChallenges() {
  const challengeList = h('div', { class: 'list' }, state.mock.challenges.map(c =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, c.title),
        h('div', { class: 'meta' }, `Due ${c.deadline} • ${c.credits} points`)
      ]),
      // ปรับปรุงการจัดวางปุ่ม "View" และ "..." ให้อยู่ห่างกันและจัดกลาง
      h('div', { class: 'list-actions' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate(`challenges/edit/${c.id}`) }, 'Edit'),
        h('button', { class: 'btn ghost', onclick: () => {
          showModal(h('div', {}, [
            h('h2', {}, 'Delete Challenge'),
            h('p', {}, `Are you sure you want to delete "${c.title}"?`),
            h('div', { class: 'spacer' }),
            h('div', { class: 'row right' }, [
              h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
              h('button', { class: 'btn danger', onclick: () => {
                state.mock.challenges = state.mock.challenges.filter(item => item.id !== c.id);
                localStorage.setItem('challenges', JSON.stringify(state.mock.challenges));
                hideModal();
                render();
              }}, 'Delete')
            ])
          ]))
        }}, '...')
      ])
    ])
  ));
  
  const submissionsTable = h('table', { class: 'table' }, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', {}, 'Team'),
        h('th', {}, 'Challenge'),
        h('th', {}, 'By'),
        h('th', {}, 'Submitted At'),
        h('th', {}, 'Status'),
        h('th', {}, 'Actions')
      ])
    ]),
    h('tbody', {}, state.mock.submissions.map(s => h('tr', {}, [
      h('td', {}, s.team),
      h('td', {}, s.challenge),
      h('td', {}, s.by),
      h('td', {}, s.at),
      h('td', {}, h('div', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status)),
      h('td', { style: 'text-align: right;' }, h('button', { class: 'btn ghost', onclick: () => navigate(`assignments/view/${s.id}`) }, 'Open'))
    ])))
  ]);

  let navActions = [
    h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back'),
    h('button', { class: 'btn primary', onclick: () => navigate('challenges/create') }, 'Add New Challenge')
  ];

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, 'Challenges'),
        h('div', { class: 'muted' }, 'Create and manage challenges')
      ])
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'card' }, [
      h('h2', {}, 'Challenges List'),
      h('div', { class: 'spacer' }),
      challengeList
    ]),
    h('div', { class: 'spacer-lg' }),
    h('h2', {}, 'Challenge Submissions'),
    h('div', { class: 'spacer' }),
    h('div', { class: 'card' }, [
      h('div', { class: 'card-content-scroll' }, submissionsTable)
    ])
  ]);
  layout('Manage Challenges', navActions, content);
}

// ฟังก์ชันใหม่สำหรับหน้าแก้ไข Challenge โดยตรง
function renderEditChallenge(id) {
  const challenge = state.mock.challenges.find(c => c.id === id);
  if (!challenge) {
    navigate('challenges/manage');
    return;
  }

  const updateChallenge = (e) => {
    e.preventDefault();
    const form = e.target;
    const index = state.mock.challenges.findIndex(c => c.id === id);
    if (index !== -1) {
      state.mock.challenges[index] = {
        ...state.mock.challenges[index],
        title: form.title.value,
        description: form.description.value,
        credits: parseInt(form.points.value, 10),
        deadline: form.due_date.value,
      };
      localStorage.setItem('challenges', JSON.stringify(state.mock.challenges));
      navigate('challenges/manage');
      render();
    }
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, 'Edit Challenge'),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: updateChallenge }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { type: 'text', name: 'title', class: 'input', required: true, value: challenge.title })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { type: 'date', name: 'due_date', class: 'input', required: true, value: challenge.deadline })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Points *'),
        h('input', { type: 'number', name: 'points', class: 'input', required: true, min: '1', value: challenge.credits })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { name: 'description', class: 'input', placeholder: 'Challenge description...', required: true }, challenge.description)
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate('challenges/manage'), type: 'button' }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, 'Update Challenge')
      ])
    ])
  ]);
  layout('Edit Challenge', [h('button', { class: 'btn ghost', onclick: () => navigate('challenges/manage') }, 'Back')], content);
}

function renderCreateChallenge() {
  const save = (e) => {
    e.preventDefault();
    const form = e.target;
    const newItem = {
      id: `c${Date.now()}`,
      title: form.title.value,
      description: form.description.value,
      credits: parseInt(form.points.value, 10),
      deadline: form.due_date.value,
    };
    state.mock.challenges.push(newItem);
    localStorage.setItem('challenges', JSON.stringify(state.mock.challenges));
    navigate('challenges/manage');
    render();
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, 'Create Challenge'),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: save }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { type: 'text', name: 'title', class: 'input', required: true })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { type: 'date', name: 'due_date', class: 'input', required: true })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Points *'),
        h('input', { type: 'number', name: 'points', class: 'input', required: true, min: '1' })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { name: 'description', class: 'input', placeholder: 'Challenge description...', required: true })
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate('challenges/manage'), type: 'button' }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, 'Create Challenge')
      ])
    ])
  ]);
  layout('Create Challenge', [h('button', { class: 'btn ghost', onclick: () => navigate('challenges/manage') }, 'Back')], content);
}

// --- Assignments Functions ---
function renderManageAssignments() {
  const assignmentList = h('div', { class: 'list' }, state.mock.assignments.map(a =>
    h('div', { class: 'list-item' }, [
      h('div', { class: 'ticket' }, [
        h('div', { class: 'title' }, a.title),
        h('div', { class: 'meta' }, `Due ${a.deadline} • ${a.credits} credits`)
      ]),
      h('div', { class: 'list-actions' }, [
        // เปลี่ยนปุ่มจาก "View" เป็น "Edit" และลิงก์ไปยังหน้าแก้ไขที่สร้างใหม่
        h('button', { class: 'btn ghost', onclick: () => navigate(`assignments/edit/${a.id}`) }, 'Edit'),
        h('button', { class: 'btn ghost', onclick: () => {
          showModal(h('div', {}, [
            h('h2', {}, 'Delete Assignment'),
            h('p', {}, `Are you sure you want to delete "${a.title}"?`),
            h('div', { class: 'spacer' }),
            h('div', { class: 'row right' }, [
              h('button', { class: 'btn ghost', onclick: hideModal }, 'Cancel'),
              h('button', { class: 'btn danger', onclick: () => {
                state.mock.assignments = state.mock.assignments.filter(item => item.id !== a.id);
                localStorage.setItem('assignments', JSON.stringify(state.mock.assignments));
                hideModal();
                render();
              }}, 'Delete')
            ])
          ]))
        }}, '...')
      ])
    ])
  ));

  const submissionsTable = h('table', { class: 'table' }, [
    h('thead', {}, [
      h('tr', {}, [
        h('th', {}, 'Team'),
        h('th', {}, 'Assignment'),
        h('th', {}, 'By'),
        h('th', {}, 'Submitted At'),
        h('th', {}, 'Status'),
        h('th', {}, 'Actions')
      ])
    ]),
    h('tbody', {}, state.mock.submissions.map(s => h('tr', {}, [
      h('td', {}, s.team),
      h('td', {}, s.assignment),
      h('td', {}, s.by),
      h('td', {}, s.at),
      h('td', {}, h('div', { class: `pill ${s.status === 'Submitted' ? 'ok' : 'warn'}` }, s.status)),
      // ลิงก์ไปหน้าแสดง submission เพื่อดูไฟล์และให้คะแนน
      h('td', { style: 'text-align: right;' }, h('button', { class: 'btn ghost', onclick: () => navigate(`assignments/view/${s.id}`) }, 'View'))
    ])))
  ]);

  let navActions = [
    h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back'),
    h('button', { class: 'btn primary', onclick: () => navigate('assignments/create') }, 'Add New Assignment')
  ];

  const content = h('div', {}, [
    h('div', { class: 'row' }, [
      h('div', { style: 'flex: 1;' }, [
        h('h2', {}, 'Manage Assignments'),
        h('div', { class: 'muted' }, 'Create and manage assignments')
      ])
    ]),
    h('div', { class: 'spacer' }),
    h('div', { class: 'card' }, [
      h('h2', {}, 'Assignments List'),
      h('div', { class: 'spacer' }),
      assignmentList
    ]),
    h('div', { class: 'spacer-lg' }),
    h('h2', {}, 'Assignment Submissions'),
    h('div', { class: 'spacer' }),
    h('div', { class: 'card' }, [
      h('div', { class: 'card-content-scroll' }, submissionsTable)
    ])
  ]);
  layout('Manage Assignments', navActions, content);
}

// ฟังก์ชันใหม่สำหรับหน้าแก้ไข Assignment โดยเฉพาะ
function renderEditAssignment(id) {
  const assignment = state.mock.assignments.find(a => a.id === id);
  if (!assignment) {
    navigate('assignments/manage');
    return;
  }

  const updateAssignment = (e) => {
    e.preventDefault();
    const form = e.target;
    const index = state.mock.assignments.findIndex(a => a.id === id);
    if (index !== -1) {
      state.mock.assignments[index] = {
        ...state.mock.assignments[index],
        title: form.title.value,
        description: form.description.value,
        credits: parseInt(form.points.value, 10),
        deadline: form.due_date.value,
      };
      localStorage.setItem('assignments', JSON.stringify(state.mock.assignments));
      navigate('assignments/manage');
      render();
    }
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, 'Edit Assignment'),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: updateAssignment }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { type: 'text', name: 'title', class: 'input', required: true, value: assignment.title })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { type: 'date', name: 'due_date', class: 'input', required: true, value: assignment.deadline })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Credits *'),
        h('input', { type: 'number', name: 'points', class: 'input', required: true, min: '1', value: assignment.credits })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { name: 'description', class: 'input', placeholder: 'Assignment description...', required: true }, assignment.description)
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate('assignments/manage'), type: 'button' }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, 'Update Assignment')
      ])
    ])
  ]);
  layout('Edit Assignment', [h('button', { class: 'btn ghost', onclick: () => navigate('assignments/manage') }, 'Back')], content);
}


// ฟังก์ชันใหม่สำหรับหน้าแสดง Submission เพื่อดูไฟล์และให้คะแนน
function renderViewAssignment(id) {
  const submission = state.mock.submissions.find(s => s.id === id);
  if (!submission) {
    navigate('assignments/manage');
    return;
  }

  const gradeSubmission = (e) => {
    e.preventDefault();
    const form = e.target;
    const newGrade = form.grade.value;
    const index = state.mock.submissions.findIndex(s => s.id === id);
    if (index !== -1) {
      state.mock.submissions[index].grade = newGrade;
      state.mock.submissions[index].status = 'Graded';
      // สมมติว่ามีระบบอัปเดต credits ให้ด้วย
      const studentUser = state.mock.users.find(u => u.name === submission.by);
      if (studentUser) {
        state.credits.student.balance += parseInt(newGrade, 10);
      }
      localStorage.setItem('submissions', JSON.stringify(state.mock.submissions));
      localStorage.setItem('credits', JSON.stringify(state.credits));
      hideModal();
      navigate('assignments/manage');
    }
  };

  const fileList = h('ul', { class: 'file-list' }, submission.files.map(file =>
    h('li', {}, [
      h('a', { href: '#', onclick: () => showModal(h('div', {}, `Viewing file: ${file.name}`)) }, file.name),
      h('span', { class: 'muted' }, ` (${file.size})`)
    ])
  ));

  const content = h('div', { class: 'card' }, [
    h('h2', {}, `Submission for "${submission.assignment}"`),
    h('div', { class: 'muted' }, `Submitted by ${submission.by} (${submission.team})`),
    h('div', { class: 'spacer' }),
    h('h3', {}, 'Attached Files'),
    h('div', { class: 'spacer-sm' }),
    fileList,
    h('div', { class: 'spacer-lg' }),
    h('h3', {}, 'Grade Submission'),
    h('div', { class: 'spacer-sm' }),
    h('form', { onsubmit: gradeSubmission }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Score'),
        h('input', { type: 'number', name: 'grade', class: 'input', required: true, min: '0', max: '100', value: submission.grade || '' })
      ]),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ok', type: 'submit' }, 'Submit Grade')
      ])
    ])
  ]);
  layout('View Assignment', [h('button', { class: 'btn ghost', onclick: () => navigate('assignments/manage') }, 'Back')], content);
}

function renderCreatePage(type) {
  const isAssignment = type === 'assignments';
  const save = (e) => {
    e.preventDefault();
    const form = e.target;
    const newItem = {
      id: `${isAssignment ? 'a' : 'c'}${Date.now()}`,
      title: form.title.value,
      description: form.description.value,
      credits: parseInt(form.points.value, 10),
      deadline: form.due_date.value,
      mentor: isAssignment ? state.user.name : undefined,
    };
    state.mock[isAssignment ? 'assignments' : 'challenges'].push(newItem);
    localStorage.setItem(isAssignment ? 'assignments' : 'challenges', JSON.stringify(state.mock[isAssignment ? 'assignments' : 'challenges']));
    navigate(isAssignment ? 'assignments/manage' : 'challenges/manage');
    render();
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, `Create ${isAssignment ? 'Assignment' : 'Challenge'}`),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: save }, [
      h('div', { class: 'field' }, [
        h('label', {}, 'Title *'),
        h('input', { type: 'text', name: 'title', class: 'input', required: true })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Due Date *'),
        h('input', { type: 'date', name: 'due_date', class: 'input', required: true })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, `Points / Credits *`),
        h('input', { type: 'number', name: 'points', class: 'input', required: true, min: '1' })
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Description'),
        h('textarea', { name: 'description', class: 'input', placeholder: 'Challenge description...', required: true })
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ghost', onclick: () => navigate(isAssignment ? 'assignments/manage' : 'challenges/manage'), type: 'button' }, 'Cancel'),
        h('button', { class: 'btn primary', type: 'submit' }, `Create ${isAssignment ? 'Assignment' : 'Challenge'}`)
      ])
    ])
  ]);
  layout(`Create ${isAssignment ? 'Assignment' : 'Challenge'}`, [h('button', { class: 'btn ghost', onclick: () => navigate(isAssignment ? 'assignments/manage' : 'challenges/manage') }, 'Back')], content);
}


// --- Credits Functions ---
// ฟังก์ชันใหม่สำหรับหน้า Give Credits ตามดีไซน์ล่าสุด
function renderGiveCredits() {
  const giveCredits = (e) => {
    e.preventDefault();
    const form = e.target;
    const user = form.user_select.value;
    const credits = parseInt(form.credits_amount.value, 10);
    const reason = form.reason.value;

    const userToUpdate = state.mock.users.find(u => u.id === user);
    if (userToUpdate) {
      if (userToUpdate.role === 'student') {
        state.credits.student.balance += credits;
      } else if (userToUpdate.role === 'mentor') {
        state.credits.mentor.balance += credits;
      }
      state.credits.admin.totalGranted += credits;

      // สามารถเพิ่ม logic การบันทึก credit history ได้ที่นี่
      console.log(`Granted ${credits} credits to ${userToUpdate.name} for: ${reason}`);
      localStorage.setItem('credits', JSON.stringify(state.credits));
    }

    showModal(h('div', {}, [
      h('h2', {}, 'สำเร็จ'),
      h('p', {}, `มอบเครดิตจำนวน ${credits} ให้กับ ${userToUpdate.name} เรียบร้อยแล้ว`),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: hideModal }, 'ตกลง')
    ]));
  };

  const content = h('div', { class: 'card' }, [
    h('h2', {}, 'Give Credits'),
    h('div', { class: 'muted' }, 'Grant credits to any user in the system.'),
    h('div', { class: 'spacer' }),
    h('form', { onsubmit: giveCredits }, [
      // จัด 4 ช่องให้อยู่ในบรรทัดเดียวกัน
      h('div', { class: 'grid-4-col' }, [
        h('div', { class: 'field' }, [
          h('label', {}, 'Team'),
          h('select', { class: 'input', name: 'team_select' }, [
            h('option', { value: '' }, 'Select Team...'),
            h('option', { value: 'team1' }, 'Team Alpha'),
            h('option', { value: 'team2' }, 'Team Beta')
          ])
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'User'),
          h('select', { class: 'input', name: 'user_select', required: true }, state.mock.users.map(u => h('option', { value: u.id }, `${u.name} (${u.role})`)))
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Category'),
          h('select', { class: 'input', name: 'category_select' }, [
            h('option', { value: '' }, 'Select Category...'),
            h('option', { value: 'assignment' }, 'Assignment'),
            h('option', { value: 'challenge' }, 'Challenge'),
            h('option', { value: 'bonus' }, 'Bonus')
          ])
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Amount'),
          h('input', { type: 'number', class: 'input', name: 'credits_amount', placeholder: 'e.g., 100', required: true, min: '1' })
        ])
      ]),
      h('div', { class: 'field' }, [
        h('label', {}, 'Reason'),
        h('textarea', { class: 'input', name: 'reason', placeholder: 'Reason for granting credits...', required: true })
      ]),
      h('div', { class: 'spacer' }),
      h('div', { class: 'row right' }, [
        h('button', { class: 'btn ok', type: 'submit' }, 'Grant Credits')
      ])
    ])
  ]);
  layout('Give Credits', [h('button', { class: 'btn ghost', onclick: () => navigate('home') }, 'Back')], content);
}


// --- Auth Views ---
function renderLoginPage() {
  const login = (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const user = state.mock.users.find(u => u.email === email && u.password === password);
    if (user) {
      state.user = user;
      navigate('home');
      render();
    } else {
      showModal(h('div', {}, [
        h('h2', {}, 'Login Failed'),
        h('p', {}, 'Invalid email or password.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
    }
  };

  const content = h('div', { class: 'login-container' }, [
    h('div', { class: 'card login-card' }, [
      h('div', { class: 'brand-logo' }, [
        h('img', { 
          src: 'visionary-logo.png', 
          alt: 'Visionary Logo', 
          style: 'height: 60px;'
        }),
        h('h1', {}, 'VISIONARY')
      ]),
      h('h2', {}, 'Welcome Back!'),
      h('p', { class: 'muted' }, 'Please login to your account'),
      h('div', { class: 'spacer' }),
      h('form', { onsubmit: login }, [
        h('div', { class: 'field' }, [
          h('label', {}, 'Email'),
          h('input', { type: 'email', id: 'email', class: 'input', placeholder: 'your@email.com', required: true })
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Password'),
          h('input', { type: 'password', id: 'password', class: 'input', placeholder: '********', required: true })
        ]),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', type: 'submit' }, 'Log In'),
        h('div', { class: 'spacer-lg' }),
        h('div', { class: 'muted', style: 'text-align: center;' }, [
          h('span', {}, `Don't have an account?`),
          h('a', { href: '#signup', style: 'margin-left: 5px; color: var(--accent); text-decoration: underline; cursor: pointer;' }, 'Sign Up here')
        ])
      ])
    ])
  ]);

  app.innerHTML = '';
  app.appendChild(content);
}

function renderSignupPage() {
  const signup = (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (state.mock.users.find(u => u.email === email)) {
      showModal(h('div', {}, [
        h('h2', {}, 'Sign Up Failed'),
        h('p', {}, 'This email is already registered.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: hideModal }, 'OK')
      ]));
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role: 'student',
    };
    
    state.mock.users.push(newUser);
    state.user = newUser;
    navigate('home');
    render();
  };

  const content = h('div', { class: 'login-container' }, [
    h('div', { class: 'card login-card' }, [
      h('div', { class: 'brand-logo' }, [
        h('img', { 
          src: 'visionary-logo.png', 
          alt: 'Visionary Logo', 
          style: 'height: 60px;'
        }),
        h('h1', {}, 'VISIONARY')
      ]),
      h('h2', {}, 'Create Your Account'),
      h('p', { class: 'muted' }, 'Join us in the DRE Platform!'),
      h('div', { class: 'spacer' }),
      h('form', { onsubmit: signup }, [
        h('div', { class: 'field' }, [
          h('label', {}, 'Your Name'),
          h('input', { type: 'text', id: 'name', class: 'input', placeholder: 'John Doe', required: true })
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Email'),
          h('input', { type: 'email', id: 'email', class: 'input', placeholder: 'your@email.com', required: true })
        ]),
        h('div', { class: 'field' }, [
          h('label', {}, 'Password'),
          h('input', { type: 'password', id: 'password', class: 'input', placeholder: '********', required: true })
        ]),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', type: 'submit' }, 'Sign Up'),
        h('div', { class: 'spacer-lg' }),
        h('div', { class: 'muted', style: 'text-align: center;' }, [
          h('span', {}, `Don't have an account?`),
          h('a', { href: '#login', style: 'margin-left: 5px; color: var(--accent); text-decoration: underline; cursor: pointer;' }, 'Log In here')
        ])
      ])
    ])
  ]);

  app.innerHTML = '';
  app.appendChild(content);
}

function logout() {
  state.user = null;
  navigate('login');
  render();
}

// --- Routes ---
registerRoute('home', renderHomePage);
registerRoute('login', renderLoginPage);
registerRoute('signup', renderSignupPage);
registerRoute('agenda', renderAdminAgenda);
registerRoute('challenges/manage', renderManageChallenges);
registerRoute('challenges/create', () => renderCreatePage('challenges'));
registerRoute('challenges/edit/:id', (params) => renderEditChallenge(params.id));
registerRoute('assignments/manage', renderManageAssignments);
registerRoute('assignments/create', () => renderCreatePage('assignments'));
registerRoute('assignments/edit/:id', (params) => renderEditAssignment(params.id)); // เพิ่ม route สำหรับแก้ไข Assignment
registerRoute('assignments/view/:id', (params) => renderViewAssignment(params.id));
registerRoute('credits/give', renderGiveCredits);

// Simple path-to-regex support for :id parameters
function matchRoute(path) {
  for (const [pattern, handler] of Object.entries(routeRegistry)) {
    const partsP = pattern.split('/');
    const partsX = path.split('/');
    if (partsP.length !== partsX.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < partsP.length; i++) {
      const p = partsP[i];
      const x = partsX[i];
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(x);
      else if (p !== x) { ok = false; break; }
    }
    if (ok) return { handler, params };
  }
  return null;
}

// Initial render
window.addEventListener('hashchange', render);
async function render() {
  const path = getPath();
  const match = matchRoute(path);
  if (match && match.handler) {
    match.handler(match.params);
  } else {
    navigate('login'); // Default to login page if no route matches
  }
}

window.onload = async function() {
  await loadData();
  render();
};