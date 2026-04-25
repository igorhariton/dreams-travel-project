using TravelBackend.BusinessLayer.Core;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Responces;
using TravelBackend.Domain.Models.User;

namespace TravelBackend.BusinessLayer.Structure
{
    public class UserAuthAction : UserActions, IUserLoginAction
    {
        public UserAuthAction() { }

        public ActionResponce UserLoginDataValidation(UserLoginDto udata)
        {
            var isValid = UserLoginDataValidationExecution(udata);
            if (isValid)
            {
                var token = UserTokenGeneration(udata);
                return new ActionResponce
                {
                    IsSuccess = true,
                    Message = $"Login successful. Token: {token}"
                };
            }

            return new ActionResponce
            {
                IsSuccess = false,
                Message = "Invalid user credentials."
            };
        }
    }
}
