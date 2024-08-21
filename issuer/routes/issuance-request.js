/**
 * @swagger
 * /api/issuer/issuance-request:
 *   post:
 *     summary: Submit Issuance Request
 *     description: Submits an issuance request with the provided data.
 *     tags:
 *       - Issuer 
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: issuanceRequest
 *         in: body
 *         description: JSON containing issuance request data.
 *         required: true
 *         schema:
 *           $ref: '#/definitions/IssuanceRequest'
 * 
 *     responses:
 *       200:
 *         description: Issuance request submitted successfully
 *       400:
 *         description: Bad request. Invalid input.
 *       500:
 *         description: Internal server error
 */

// Swagger definitions
/**
 * @swagger
 * definitions:
 *   IssuanceRequest:
 *     type: object
 *     properties:
 *       includeQRCode:
 *         type: boolean
 *       callback:
 *         type: object
 *         properties:
 *           url:
 *             type: string
 *           state:
 *             type: string
 *           headers:
 *             type: object
 *       authority:
 *         type: string
 *       registration:
 *         type: object
 *         properties:
 *           clientName:
 *             type: string
 *           purpose:
 *             type: string
 *       type:
 *         type: string
 *       manifest:
 *         type: string
 *       pin:
 *         type: object
 *         properties:
 *           value:
 *             type: string
 *           length:
 *             type: integer
 *       claims:
 *         type: object
 *         
 */