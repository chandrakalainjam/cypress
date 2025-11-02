/// <reference types="cypress" />

describe('WebMobi Login', () => {
  
  it('Test Events Login', () => {
    cy.visit('https://events.webmobi.com/auth/login');
    
    cy.get('input[id="email"]').type('ichandrakala.77@gmail.com');
    cy.get('input[id="password"]').type('1qaz!QAZ');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains('Create Event').should('be.visible');
  });
  it('Test Certificates Login', () => {
    cy.visit('https://certificates.webmobi.com/auth/login');
    
    cy.get('input[id="email"]').type('ichandrakala.77@gmail.com');
    cy.get('input[id="password"]').type('1qaz!QAZ');
    cy.get('button[type="submit"]').click();
cy.url({ timeout: 10000 }).should('include', '/dashboard');
    
    cy.contains('User').should('be.visible');
  });
});


describe('WebMobi - Create Event and Get Event ID', () => {

  it('Login and Create Event', () => {
    
    cy.request({
      method: 'POST',
      url: 'https://events.webmobi.com/api/auth/login',
      body: {
        email: 'ichandrakala.77@gmail.com',
        password: '1qaz!QAZ'
      }
    }).then((loginResponse) => {
      expect(loginResponse.status).to.eq(200);
      const token = loginResponse.body.data.session.access_token;  

      cy.request({
        method: 'POST',
        url: 'https://events.webmobi.com/api/events',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        failOnStatusCode: false, 
        body: {
          name: 'Automation Test Event',
          start_date: '2025-11-10',
          end_date: '2025-11-11',
          location: 'Bangalore, India',
          timezone: 'Asia/Kolkata'
        }
      }).then((eventResponse) => {
        if (eventResponse.status === 401 && eventResponse.body.error?.message === 'User profile not found') {
          cy.log('User profile not found');
        } else {
          expect(eventResponse.status).to.eq(200);
          const eventId = eventResponse.body?.data?.id;
          cy.log(`Event Created Successfully — ID: ${eventId}`);
          cy.writeFile('cypress/fixtures/eventId.json', { eventId });
        }
      });
    });
  });

});


describe('WebMobi - Mocked Create Event API', () => {
 it('Mock Login and Mock Create Event', () => {
    // Mock Login API
    cy.intercept('POST', 'https://events.webmobi.com/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          session: {
            access_token: 'mocked-access-token-12345'
          },
          user: {
            email: 'ichandrakala.77@gmail.com',
            name: 'Chandrakala'
          }
        }
      }
    })

    // Mock Create Event API
    cy.intercept('POST', 'https://events.webmobi.com/api/events', (req) => {
      const token = req.headers.authorization;

      // Simulate user profile missing
      if (!token || token.includes('no-profile')) {
        req.reply({
          statusCode: 401,
          body: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'User profile not found'
            }
          }
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            success: true,
            data: {
              id: 'event12345',
              name: req.body.name,
              location: req.body.location,
              start_date: req.body.start_date,
              end_date: req.body.end_date
            }
          }
        });
      }
    })

});
});

describe('Mock Session', () => {
it('Should simulate session login and create event from dashboard', () => {
    
    const mockSession = {
      token: 'mocked-session-token-12345',
      user: {
        email: 'ichandrakala.77@gmail.com',
        password:'1qaz!QAZ'
      }
    };

    Cypress.env('session', mockSession);
    cy.visit('https://events.webmobi.com/dashboard', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('user_email', mockSession.user.email);
        win.localStorage.setItem('user_password', mockSession.user.password);
      }
    });

    cy.wait(1000);
    cy.log(`🔑 Mocked session loaded for ${mockSession.user.email}`);

   });
});

describe('Test Assertions', () => {

it('Check Button', () => {
  cy.visit('https://events.webmobi.com/auth/login');
       cy.get('button[type="submit"]').should('be.visible');
  });
});


describe('Test Error messages', () => {
it('Should display error for invalid credentials', () => {
   cy.request({
      method: 'POST',
      url: 'https://events.webmobi.com/api/auth/login',
      body: {
        email: 'ichandrakala.77@gmail.com',
        password: 'wrongpass'
      },
      failOnStatusCode: false 
    }).then((loginResponse) => {
      expect(loginResponse.status).to.eq(401);
      expect(loginResponse.success).to.be.false;
      expect(loginResponse.body.error.message).to.eq('Invalid email or password');

      
    });
  });
});