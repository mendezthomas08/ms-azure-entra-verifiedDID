/**
 * @swagger
 * /api/verifier/presentation-request:
 *   post:
 *     summary: Submit Presentation Request
 *     description: Submits a presentation request with the provided data.
 *     tags:
 *       - Verifier 
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: presentationRequest
 *         in: body
 *         description: JSON containing presentation request data.
 *         required: true
 *         schema:
 *           $ref: '#/definitions/PresentationRequest'
 * 
 *     responses:
 *       200:
 *         description: Presentation request submitted successfully
 *       400:
 *         description: Bad request. Invalid input.
 *       500:
 *         description: Internal server error
 */

// Swagger definitions
/**
 * @swagger
 * definitions:
 *   PresentationRequest:
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
 *       includeReceipt:
 *         type: boolean
 *       requestedCredentials:
 *         type: array
 *         items:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *             acceptedIssuers:
 *               type: array
 *               items:
 *                 type: string
 *       configuration:
 *         type: object
 *         properties:
 *           validation:
 *             type: object
 *             properties:
 *               allowRevoked:
 *                 type: boolean
 *               validateLinkedDomain:
 *                 type: boolean
 */