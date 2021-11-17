import LandingPage from '../pages/landingPage'
import CodeManagementPage from '../pages/enterpriseCodeManagement'
import EnterpriseCoupons from '../helpers/enterpriseCoupons'
import HelperFunctions from '../helpers/helperFunctions'

describe('coupon reports tests', function () {
  const landingPage = new LandingPage()
  const codeManagementDashboard = new CodeManagementPage()
  const coupons = new EnterpriseCoupons()

  before(function () {
    const couponType = 'discount_single_use_absolute'
    coupons.LoginAsAdmin()
    coupons.prepareCouponData(couponType).then((couponData) => {
      const requestData = couponData
      requestData[couponType].quantity = '1'
      coupons.createCoupon(couponData[couponType]).then((response) => {
        cy.wrap(response.body.coupon_id).as('couponId')
      })
    })
  })

  beforeEach(function () {
    Cypress.Cookies.preserveOnce(
      'edxloggedin',
      'stage-edx-user-info',
      'stage-edx-sessionid',
    )
    cy.visit('/')
    landingPage.goToEnterprise(Cypress.env('enterprise_name'))
    landingPage.openCodeManagement()
  })

  it('Validate the coupon report data', function () {
    cy.server()
    cy.get('@couponId').then((couponId) => {
      cy.route(
        'GET',
        `**/api/v2/enterprise/coupons/${couponId}/codes.csv/?code_filter=unassigned**`,
      ).as('unassignedresults')
      cy.route(
        'GET',
        `**/api/v2/enterprise/coupons/${couponId}/codes.csv/?code_filter=unredeemed**`,
      ).as('assignedresults')
      coupons.fetchCouponReport(couponId).then((response) => {
        const couponReport = response.body
        const [couponName] = couponReport.match(/Test_Coupon_\w+/g)
        codeManagementDashboard.getCoupon().contains(couponName).click()
        // Click on Download Coupon Report Button
        codeManagementDashboard.downloadCouponReport()
      })
    })
    // Check CSV data before assignment
    cy.wait('@unassignedresults').then((xhr) => {
      const responseBody = xhr.response.body
      const reportData = HelperFunctions.parseReportData(responseBody)
      expect(reportData.assigned_to).to.eql('')
      codeManagementDashboard
        .getCouponCode(3)
        .should('have.text', reportData.redeem_url)
    })
    codeManagementDashboard.getAssignActionButton().click()
    // Assigns the code by submitting the email
    codeManagementDashboard.getModalWindow().then((win) => {
      cy.wrap(win)
        .find('input[name="email-address"]')
        .type('cypressTestEmail@edx.org')
      cy.wrap(win).find('.modal-footer .btn:nth-of-type(2)').click()
    })
    codeManagementDashboard.getCodeStatusFilter().select('Unredeemed')
    codeManagementDashboard.downloadCouponReport()
    // Check CSV data after assignment
    cy.wait('@assignedresults').then((xhr) => {
      const responseBody = xhr.response.body
      const reportData = HelperFunctions.parseReportData(responseBody)
      expect(reportData.assigned_to).to.eql('cypressTestEmail@edx.org')
      // codeManagementDashboard.getCouponCode(4).should('have.text', reportData.code)
    })
  })

  after(function () {
    cy.get('@couponId').then((couponId) => {
      coupons.deleteCoupon(couponId)
    })
  })
})
